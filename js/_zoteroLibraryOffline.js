/*=== Full Library Loading ===*/
Zotero.callbacks.loadFullLibrary = function(el){
    Zotero.debug("Zotero.callbacks.loadFullLibrary", 3);
    //try to load library from local storage or indexedDB
    //
    //if we have local library already then pull modified item keys and get updates
    //--get list of itemkeys ordered by dateModified
    //--get a fresh copy of the most recently modified item
    //--if we have a copy of MRM and modified times/etags match we're done
    //--else: check exponentially further back items until we find a match, then load all items more recently modified
    //else: pull down enough of the library to display, then start pulling down full library
    //(or only pull down full with make available offline?)
    
    var library = Zotero.ui.getAssociatedLibrary(el);
    var displayParams = {};
    
    // put the selected tags into an array
    var selectedTags = Zotero.nav.getUrlVar('tag');
    if(!J.isArray(selectedTags)){
        if(selectedTags) {
            selectedTags = [selectedTags];
        }
        else {
            selectedTags = [];
        }
    }
    
    if(J("#library").hasClass('loaded')){
        //library has already been loaded once, just need to update view, not fetch data
        
        //update item pane display based on url
        Zotero.callbacks.chooseItemPane(J("#items-pane"));
        
        //update collection tree
        Zotero.ui.highlightCurrentCollection();
        Zotero.ui.nestHideCollectionTree(J("#collection-list-container"));
        
        //update tags display
        var plainList = library.tags.plainTagsList(library.tags.tagsArray);
        Zotero.ui.displayTagsFiltered(J("#tags-list-div"), library.tags, plainList, selectedTags);
        
        Zotero.ui.displayItemOrTemplate(library);
        
        //build new itemkeys list based on new url
        Z.debug("Building new items list to display", 3);
        //displayParams = Zotero.nav.getUrlVars();
        displayParams = J.extend({}, Zotero.config.defaultApiArgs, Zotero.config.userDefaultApiArgs, Zotero.nav.getUrlVars());
        
        Z.debug(displayParams);
        library.buildItemDisplayView(displayParams);
        //render new itemlist
        
    }
    else {
        Zotero.offline.initializeOffline();
    }
};

/* -----offline library ----- */
Zotero.ui.init.offlineLibrary = function(){
    Z.debug("Zotero.ui.init.offlineLibrary", 3);
    
    Zotero.ui.init.libraryControls();
    Zotero.ui.init.tags();
    Zotero.ui.init.collections();
    Zotero.ui.init.items();
    //Zotero.ui.init.feed();
    
    J.subscribe('loadItemsFromKeysParallelDone', function(){
        J.publish("displayedItemsUpdated");
    });
    
    J.subscribe("displayedItemsUpdated", function(){
        Z.debug("displayedItemsUpdated triggered", 3);
        var library = Zotero.ui.getAssociatedLibrary(J("#library"));
        Zotero.ui.displayItemsFullLocal(J("#library-items-div"), {}, library);
    });
    J.subscribe("collectionsUpdated", function(){
        Z.debug("collectionsUpdated triggered", 3);
        var library = Zotero.ui.getAssociatedLibrary(J("#library"));
        Zotero.ui.displayCollections(J("#collection-list-container"), library.collections.collectionsArray);
    });
    J.subscribe("tagsUpdated", function(){
        Z.debug("tagsUpdated triggered", 3);
        var library = Zotero.ui.getAssociatedLibrary(J("#library"));
        var plainList = library.tags.plainTagsList(library.tags.tagsArray);
        var matchedList = Zotero.utils.prependAutocomplete('', plainList);
        Zotero.ui.displayTagsFiltered(J("#tags-list-container") , library.tags, matchedList, selectedTags);
    });
    
    J("#makeAvailableOfflineLink").bind('click', J.proxy(function(e){
        e.preventDefault();
        var library = Zotero.ui.getAssociatedLibrary(J("#library"));
        var collectionKey = Zotero.nav.getUrlVar('collectionKey');
        var itemKeys;
        if(collectionKey){
            library.saveCollectionFilesOffline(collectionKey);
        }
        else{
            library.saveFileSetOffline(library.itemKeys);
        }
    }, this) );
};


/* ----- offline ----- */

/**
 * Display the full library items section
 * @param  {Dom Element} el          Container
 * @param  {object} config      items config
 * @param  {array} loadedItems loaded items array
 * @return {undefined}
 */
Zotero.ui.displayItemsFullLocal = function(el, config, library){
    Z.debug("Zotero.ui.displayItemsFullLocal", 3);
    Z.debug(config, 4);
    var jel = J(el);
    var filledConfig = J.extend({}, Zotero.config.defaultApiArgs, Zotero.config.userDefaultApiArgs, config);
    
    var titleParts = ['', '', ''];
    var displayFields = Zotero.prefs.library_listShowFields;
    if(library.libraryType != 'group'){
        displayFields = J.grep(displayFields, function(el, ind){
            return J.inArray(el, Zotero.Library.prototype.groupOnlyColumns) == (-1);
        });
    }
    var editmode = (Zotero.config.librarySettings.allowEdit ? true : false);
    
    var itemsTableData = {titleParts:titleParts,
                           displayFields:displayFields,
                           items:library.items.displayItemsArray,
                           editmode:editmode,
                           order: filledConfig['order'],
                           sort: filledConfig['sort'],
                           library:library
                        };
    //Z.debug(jel, 3);
    //Z.debug(itemsTableData);
    jel.empty();
    Zotero.ui.insertItemsTable(jel, itemsTableData);
    
    if(Zotero.config.mobile){
        Zotero.ui.createOnActivePage(el);
        return;
    }
    
    Zotero.ui.updateDisabledControlButtons();
    
    Zotero.ui.libraryBreadcrumbs();
    
    Zotero.ui.createOnActivePage(el);
};

/**
 * Get an item's children and display summary info
 * @param  {DOM Element} el      element to insert into
 * @param  {string} itemKey key of parent item
 * @return {undefined}
 */
Zotero.ui.showChildrenLocal = function(el, itemKey){
    Z.debug('Zotero.ui.showChildrenLocal', 3);
    var library = Zotero.ui.getAssociatedLibrary(J(el).closest("div.ajaxload"));
    var item = library.items.getItem(itemKey);
    var attachmentsDiv = J(el).find(".item-attachments-div");
    Zotero.ui.showSpinner(attachmentsDiv);
    
    var childItemKeys = item.childItemKeys;
    var childItems = library.items.getItems(childItemKeys);
    
    J("#childitemsTemplate").tmpl({childItems:childItems}).appendTo(J(".item-attachments-div").empty());
    
    Zotero.ui.createOnActivePage(el);
};

Zotero.ui.localDownloadLink = function(item, el){
    Z.debug("Zotero.ui.localDownloadLink");
    if(item.links && item.links.enclosure){
        Z.debug("should have local file");
        var d = item.owningLibrary.filestorage.getSavedFileObjectUrl(item.itemKey);
        d.done(function(url){
            Z.debug("got item's object url - adding to table");
            J("table.item-info-table tbody").append("<tr><th>Local Copy</th><td><a href='" + url + "'>Open</a></td></tr>");
        });
    }
    else{
        Z.debug("Missing link?");
    }
};

Zotero.ui.displayItemOrTemplate = function(library){
    if(Zotero.nav.getUrlVar('action') == 'newItem'){
        var itemType = Zotero.nav.getUrlVar('itemType');
        if(!itemType){
            J("#item-details-div").empty();
            J("#itemtypeselectTemplate").tmpl({itemTypes:Zotero.localizations.typeMap}).appendTo(J("#item-details-div"));
            return;
        }
        else{
            var newItem = new Zotero.Item();
            newItem.libraryType = library.libraryType;
            newItem.libraryID = library.libraryID;
            d = newItem.initEmpty(itemType);
            J("#item-details-div").data('pendingDeferred', d);
            d.done(Zotero.ui.loadNewItemTemplate);
            d.fail(function(jqxhr, textStatus, errorThrown){
                Zotero.ui.jsNotificationMessage("Error loading item template", 'error');
            });
        }
    }
    else{
        //display individual item if needed
        var itemKey = Zotero.nav.getUrlVar('itemKey');
        if(itemKey){
            //get the item out of the library for display
            var item = library.items.getItem(itemKey);
            if(item){
                Z.debug("have item locally, loading details into ui", 3);
                if(Zotero.nav.getUrlVar('mode') == 'edit'){
                    Zotero.ui.editItemForm(J("#item-details-div"), item);
                }
                else{
                    Zotero.ui.loadItemDetail(item, J("#item-details-div"));
                    Zotero.ui.showChildrenLocal(J("#item-details-div"), itemKey);
                    Zotero.ui.localDownloadLink(item, J("#item-details-div"));
                }
            }
        }
    }
    
};

//----------Zotero.offline
Zotero.offline.initializeOffline = function(){
    Z.debug("Zotero.offline.initializeOffline", 3);
    //check for cached libraryData, if not present load it before doing anything else
    var libraryDataDeferred = new J.Deferred();
    var cacheConfig = {target:'userlibrarydata'};
    var userLibraryData = Zotero.cache.load(cacheConfig);
    
    if(userLibraryData){
        Z.debug("had cached library data - resolving immediately");
        J('#library').data('loadconfig', userLibraryData.loadconfig);
        libraryDataDeferred.resolve(userLibraryData);
    }
    else{
        Z.debug("don't have cached library config data - fetching from server");
        J.getJSON('/user/userlibrarydata', J.proxy(function(data, textStatus, jqxhr){
            Z.debug("got back library config data from server");
            if(data.loggedin === false){
                window.location = '/user/login';
                return false;
            }
            else{
                J('#library').data('loadconfig', data.loadconfig);
                userLibraryData = data;
                libraryDataDeferred.resolve(userLibraryData);
            }
        }, this) );
    }
    
    libraryDataDeferred.done(function(userLibraryData){
        Zotero.debug("Got library data");
        Zotero.debug(userLibraryData);
        
        Zotero.loadConfig(userLibraryData);
        var library = Zotero.ui.getAssociatedLibrary(J("#library"));
        
        Zotero.offline.loadAllItems(library);
        Zotero.offline.loadAllCollections(library);
        Zotero.offline.loadAllTags(library);
        
        Zotero.offline.loadMetaInfo(library);
    });
};

Zotero.offline.loadAllItems = function(library){
    Z.debug("Zotero.offline.loadAllItems", 3);
    var itemsCacheConfig = {libraryType:library.libraryType, libraryID:library.libraryID, target:'allitems'};
    
    var haveCachedItems = library.loadCachedItems();
    if(haveCachedItems){
        //if we have cached items, display what we think the current view is right now
        //we'll update it after we make sure we're synced too
        displayParams = Zotero.nav.getUrlVars();
        library.buildItemDisplayView(displayParams);
    }
    //we need modified itemKeys regardless, so load them
    var itemKeysDeferred = library.fetchItemKeysModified();
    itemKeysDeferred.done(J.proxy(function(data, keysjqxhr){
        Z.debug("Got back itemKeys ordered by modified", 3);
        var itemKeys = J.trim(data).split("\n");
        library.itemKeys = itemKeys;
        
        if(haveCachedItems === 0 && itemKeys.length > 0) haveCachedItems = false; //explicitly set to false if no items when there are itemkeys
        if(haveCachedItems !== false){
            Z.debug("have cached items", 3);
            //pull items that we don't have at all
            var missingItemKeys = library.findMissingItems(itemKeys);
            var missingItemsDeferred = library.loadItemsFromKeysParallel(missingItemKeys);
            
            //pull modified keys
            var modifiedItemsDeferred = library.loadModifiedItems(itemKeys);
            
            //when all the deferreds are done, build the list to display
            //TODO: we may want to short circuit if there are alot of things to wait for
            J.when(missingItemsDeferred, modifiedItemsDeferred).then(J.proxy(function(){
                Z.debug("Building new items list to display", 3);
                displayParams = Zotero.nav.getUrlVars();
                library.buildItemDisplayView(displayParams);
                Zotero.cache.save(itemsCacheConfig, library.items.dump());
                
                //update item pane display based on url
                Zotero.callbacks.chooseItemPane(J("#items-pane"));
                Zotero.ui.displayItemOrTemplate(library);
            }));
        }
        else{
            //pull all itemKeys
            var loadAllItemsDeferred = library.loadItemsFromKeysParallel(itemKeys);
            loadAllItemsDeferred.done(J.proxy(function(){
                var displayParams = Zotero.nav.getUrlVars();
                Z.debug(displayParams);
                library.buildItemDisplayView(displayParams);
                Zotero.cache.save(itemsCacheConfig, library.items.dump());
            }, this ) );
        }
    }, this ) );
    
    
};

Zotero.offline.loadAllCollections = function(library){
    Z.debug("Zotero.offline.loadAllCollections", 3);
    var collectionsCacheConfig = {libraryType:library.libraryType, libraryID:library.libraryID, target:'allcollections'};
    var collectionMembersConfig = {libraryType:library.libraryType, libraryID:library.libraryID, target:'collectionmembers'};
    
    /* ---- load collections ---- */
    //get Zotero.Library object if already bound to element
    Zotero.ui.updateCollectionButtons();
    
    var haveCachedCollections = library.loadCachedCollections();
    var clist = J('#collection-list-container');
    //Zotero.ui.showSpinner(clist);
    if(haveCachedCollections){
        Z.debug("haveCachedCollections", 3);
        
        clist.empty();
        Zotero.ui.displayCollections(clist, library.collections);
        Zotero.ui.nestHideCollectionTree(clist);
        Zotero.ui.highlightCurrentCollection();
        
        //even if we have collections cached, make sure we look for collection membership info
        var collectionMembershipD = library.loadCollectionMembership(library.collections.collectionsArray);
        collectionMembershipD.done(J.proxy(function(){
            Zotero.cache.save(collectionsCacheConfig, library.collections.dump());
        }, this));
    }
    else {
        Z.debug("dont have collections - load them", 3);
        //empty contents and show spinner while loading ajax
        var d = library.loadCollections();
        d.done(J.proxy(function(){
            clist.empty();
            Zotero.ui.displayCollections(clist, library.collections);
            Zotero.ui.highlightCurrentCollection();
            Zotero.ui.nestHideCollectionTree(clist);
            
            Zotero.cache.save(collectionsCacheConfig, library.collections.dump());
            
            var collectionMembershipD = library.loadCollectionMembership(library.collections.collectionsArray);
            collectionMembershipD.done(J.proxy(function(){
                Zotero.cache.save(collectionsCacheConfig, library.collections.dump());
            }, this));
        }, this));
        
        d.fail(J.proxy(function(jqxhr, textStatus, errorThrown){
            var elementMessage = Zotero.ui.ajaxErrorMessage(jqxhr);
            jel.html("<p>" + elementMessage + "</p>");
        }));
    }
    
};

Zotero.offline.loadAllTags = function(library){
    Z.debug("Zotero.offline.loadAllTags", 3);
    var tagsCacheConfig = {libraryType:library.libraryType, libraryID:library.libraryID, target:'alltags'};
    
    /* ----- load tags ----- */
    var tagsEl = J("#tags-list-container");
    var loadTagsDeferred = library.loadAllTags({});
    
    // put the selected tags into an array
    var selectedTags = Zotero.nav.getUrlVar('tag');
    if(!J.isArray(selectedTags)){
        if(selectedTags) {
            selectedTags = [selectedTags];
        }
        else {
            selectedTags = [];
        }
    }
    
    loadTagsDeferred.done(J.proxy(function(tags){
        Z.debug("finished loadAllTags", 3);
        tagsEl.find('div.loading').empty();
        Z.debug(tags, 5);
        library.tags.loaded = true;
        library.tags.loadedConfig = {};
        tagsEl.children('.loading').empty();
        var plainList = library.tags.plainTagsList(library.tags.tagsArray);
        Zotero.ui.displayTagsFiltered(tagsEl, library.tags, plainList, selectedTags);
        Zotero.nav.doneLoading(tagsEl);
    }, this));
    
    loadTagsDeferred.fail(J.proxy(function(jqxhr, textStatus, errorThrown){
        var elementMessage = Zotero.ui.ajaxErrorMessage(jqxhr);
        jel.html("<p>" + elementMessage + "</p>");
    }));
    J("#library").addClass("loaded");
    
};

Zotero.offline.loadMetaInfo = function(library){
    Z.debug("Zotero.offline.loadMetaInfo", 3);
    /* ----- load item templates ----- */
    //all other template information is loaded and cached automatically in Zotero www init
    //but this requires many requests, so only preload templates for all itemTypes for
    //offline capable library
    if(Zotero.Item.prototype.itemTypes){
        Z.debug("have itemTypes, fetching item templates", 3);
        var itemTypes = Zotero.Item.prototype.itemTypes;
        var type;
        J.each(itemTypes, function(ind, val){
            type = val.itemType;
            if(type != 'attachment'){
                Zotero.Item.prototype.getItemTemplate(type);
            }
            Zotero.Item.prototype.getCreatorTypes(type);
        });
        //get templates for attachments with linkmodes
        Zotero.Item.prototype.getItemTemplate('attachment', 'imported_file');
        Zotero.Item.prototype.getItemTemplate('attachment', 'imported_url');
        Zotero.Item.prototype.getItemTemplate('attachment', 'linked_file');
        Zotero.Item.prototype.getItemTemplate('attachment', 'linked_url');
    }
    else {
        Z.debug("Dont yet have itemTypes, can't fetch item templates", 3);
    }
};
