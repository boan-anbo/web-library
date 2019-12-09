import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import cx from 'classnames';
import { useDrag, useDrop } from 'react-dnd-cjs'
import { getEmptyImage, NativeTypes } from 'react-dnd-html5-backend-cjs';

import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from "react-window-infinite-loader";
import { FixedSizeList as List } from 'react-window';

import columnNames from '../../../constants/column-names';
import { chunkedTrashOrDelete, createAttachmentsFromDropped, fetchSource, navigate, openAttachment, preferenceChange,
	updateItemsSorting, chunkedCopyToLibrary, chunkedAddToCollection } from '../../../actions';
import { useFocusManager, useSourceData } from '../../../hooks';
import Icon from '../../ui/icon';
import { pick } from '../../../common/immutable';
import { resizeVisibleColumns2 } from '../../../utils';
import { ATTACHMENT, ITEM } from '../../../constants/dnd';

const ROWHEIGHT = 26;

const Cell = props => {
	const { children, className, columnName, index, width } = props;

	return (
		<div
			data-colindex={ index }
			aria-colindex={ index }
			className={ cx('metadata', columnName, className) }
			data-column-name={ columnName }
			style={ { width } }
			{ ...pick(props, ['onClick', 'onKeyDown', 'tabIndex']) }
			{ ...pick(props, key => key.match(/^(aria-|data-).*/)) }
		>
			{ children }
		</div>
	)
}


const HeaderRow = memo(forwardRef((props, ref) => {
	const dispatch = useDispatch();
	const mouseState = useRef(null);
	const { columns, width, isReordering, isResizing, onReorder, onResize, reorderTargetIndex, sortBy, sortDirection } = props;
	const { handleFocus, handleBlur, handleNext, handlePrevious } = useFocusManager(ref);

	const handleClick = ev => {
		const { columnName } = ev.currentTarget.dataset;
		if(isResizing || isReordering) { return; }

		dispatch(
			updateItemsSorting(
				columnName,
				columnName === sortBy ? sortDirection === 'asc' ? 'desc' : 'asc' : 'desc'
			)
		);
	}

	const handleKeyDown = ev => {
		if((ev.key === 'ArrowDown' || ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
			if(ev.key === 'ArrowDown') {
				ev.currentTarget.closest('[tabIndex="0"]').focus();
			}
			else if(ev.key === 'ArrowRight') {
				handleNext(ev, false);
			}
			else if(ev.key === 'ArrowLeft') {
				handlePrevious(ev, false);
			}
			ev.preventDefault();
			return;
		}
	}

	const handleMouseDown = useCallback(ev => {
		if('resizeHandle' in ev.target.dataset) {
			return;
		}
		ev.persist();
		const timeout = setTimeout(() => {
			if(!isReordering && mouseState.current !== null) {
				onReorder(ev);
			}
		}, 300);
		mouseState.current = { x: ev.clientX, y: ev.clientY, stamp: Date.now(), triggerEvent: ev, timeout };
	});

	const handleMouseUp = useCallback(ev => {
		mouseState.current = null;
	});

	const handleMouseMove = useCallback(ev => {
		if(mouseState.current !== null) {
			const { triggerEvent, x, y } = mouseState.current;
			const pixelsTravelled = Math.abs(ev.clientX - x) + Math.abs(ev.clientY - y);
			if(pixelsTravelled > 10) {
				clearTimeout(mouseState.current.timeout);
				onReorder(triggerEvent);
				mouseState.current = null;
			}
		}
	});

	useEffect(() => {
		mouseState.current = null;
	}, [isReordering])

	return (
		<div
			tabIndex={ -1 }
			ref={ ref }
			className="items-table-head"
			style={ { height: ROWHEIGHT, width } }
			onKeyDown={ handleKeyDown }
			onFocus={ handleFocus }
			onBlur={ handleBlur }
			onMouseDown={ handleMouseDown }
			onMouseMove={ handleMouseMove }
			onMouseUp = { handleMouseUp }
		>
			{ columns.map((c, colIndex) => (
				<Cell
					aria-sort={ sortDirection === 'asc' ? 'ascending' : 'descending' }
					className='column-header'
					columnName={ c.field }
					index={ colIndex }
					key={ c.field }
					onClick={ handleClick }
					width={ `var(--col-${colIndex}-width)` }
					tabIndex={ -2 }
				>
					{ colIndex === reorderTargetIndex &&
						<div className="reorder-target" />
					}
					{ colIndex !== 0 &&
						<div
							data-resize-handle
							className="resize-handle"
							key="resize-handle"
							onMouseDown={ onResize }
						/>
					}
					<div className="header-label truncate">
						{
							c.field === 'attachment' ?
								<Icon type={ '16/attachment' } width="16" height="16" /> :
								c.field in columnNames ? columnNames[c.field] : c.field
						}
					</div>
					{ sortBy === c.field &&
						<Icon type={ '16/chevron-7' } width="16" height="16" className="sort-indicator" />
					}
				</Cell>
			))}
		</div>
	);
}));

HeaderRow.displayName = 'HeaderRow';

const DataCell = props => {
	const { columnName, colIndex, width, isFocused, isActive, itemData } = props;
	const dvp = window.devicePixelRatio >= 2 ? 2 : 1;

	return (
		<Cell
			width={ width }
			columnName={ columnName }
			index={ colIndex }
		>
			{ columnName === 'title' && (
				<Icon
					type={ `16/item-types/light/${dvp}x/${itemData.iconName}` }
					symbol={ isFocused && isActive ? `${itemData.iconName}-white` : itemData.iconName }
					width="16"
					height="16"
				/>
			)}
			<div className="truncate">
				{ itemData[columnName] }
			</div>
			{ columnName === 'title' && (
				<div className="tag-colors">
					{ itemData.colors.map((color, index) => (
						<Icon
							key={ color }
							type={ index === 0 ? '10/circle' : '10/crescent-circle' }
							symbol={ index === 0 ?
								(isFocused && isActive ? 'circle-focus' : 'circle') :
								(isFocused && isActive ? 'crescent-circle-focus' : 'crescent-circle')
							}
							width={ index === 0 ? 10 : 7 }
							height="10"
							style={ { color } }
						/>
					)) }
				</div>
			) }
		</Cell>
	);
}

const PlaceholderCell = props => {
	const { columnName, colIndex, width } = props;
	return (
		<Cell
			width={ width }
			columnName={ columnName }
			index={ colIndex }
		>
			{ columnName === 'title' && <div className="placeholder-icon" /> }
			<div className="placeholder" />
		</Cell>
	);
}

const selectItem = (itemKey, ev, keys, selectedItemKeys, dispatch) => {
	const isCtrlModifier = ev.getModifierState('Control') || ev.getModifierState('Meta');
	const isShiftModifier = ev.getModifierState('Shift');
	var newKeys;


	if(isShiftModifier) {
		let startIndex = selectedItemKeys.length ? keys.findIndex(key => key && key === selectedItemKeys[0]) : 0;
		let endIndex = keys.findIndex(key => key && key === itemKey);
		let isFlipped = false;
		if(startIndex > endIndex) {
			[startIndex, endIndex] = [endIndex, startIndex];
			isFlipped = true;
		}

		endIndex++;
		newKeys = keys.slice(startIndex, endIndex);
		if(isFlipped) {
			newKeys.reverse();
		}
	} else if(isCtrlModifier) {
		if(selectedItemKeys.includes(itemKey)) {
			newKeys = selectedItemKeys.filter(key => key !== itemKey);
		} else {
			newKeys = [...(new Set([...selectedItemKeys, itemKey]))];
		}
	} else {
		newKeys = [itemKey];
	}
	dispatch(navigate({ items: newKeys }));
}

const getColumnCssVars = (columns, width) => Object.fromEntries(columns.map((c, i) => [`--col-${i}-width`, `${c.fraction * width}px`]))
const DROP_MARGIN_EDGE = 5; // how many pixels from top/bottom of the row triggers "in-between" drop

const Row = memo(props => {
	const dispatch = useDispatch();
	const ref = useRef();
	const ignoreClicks = useRef({});
	const [dropZone, setDropZone] = useState(null);
	const { data, index, style } = props;
	const { onFileHoverOnRow, isFocused, keys, width, columns } = data;
	const itemKey = keys ? keys[index] : null;
	const libraryKey = useSelector(state => state.current.libraryKey);
	const collectionKey = useSelector(state => state.current.collectionKey);
	const itemData = useSelector(
		state => itemKey ?
			state.libraries[state.current.libraryKey].items[itemKey][Symbol.for('derived')]
			: null
	);
	const selectedItemKeys = useSelector(state => state.current.itemKey ?
		[state.current.itemKey] : state.current.itemKeys,
		shallowEqual
	);
	const isActive = itemKey && selectedItemKeys.includes(itemKey);

	const [_, drag, preview] = useDrag({ // eslint-disable-line no-unused-vars
		item: { type: ITEM },
		begin: () => {
			const isDraggingSelected = selectedItemKeys.includes(itemKey);
			return { itemKey, selectedItemKeys, itemData, isDraggingSelected, libraryKey }
		},
		end: (item, monitor) => {
			const isDraggingSelected = selectedItemKeys.includes(itemKey);
			const sourceItemKeys = isDraggingSelected ? selectedItemKeys : [itemKey];
			const dropResult = monitor.getDropResult();

			if(dropResult) {
				const { targetType, collectionKey: targetCollectionKey, libraryKey: targetLibraryKey } = dropResult;
				if(targetType === 'library') {
					dispatch(chunkedCopyToLibrary(sourceItemKeys, targetLibraryKey));
				}
				if(targetType === 'collection') {
					dispatch(chunkedAddToCollection(sourceItemKeys, targetCollectionKey, targetLibraryKey));
				}
			}
		}
	});

	const [{ isOver, canDrop }, drop] = useDrop({
		accept: [ATTACHMENT, NativeTypes.FILE],
		collect: monitor => ({
			isOver: monitor.isOver({ shallow: true }),
			canDrop: monitor.canDrop(),
		}),
		drop: (item, monitor) => {
			const itemType = monitor.getItemType();
			if(itemType === NativeTypes.FILE) {
				const parentItem = dropZone === null ? itemKey : null;
				const collection = parentItem === null ? collectionKey : null;
				const isAttachmentOnAttachment = parentItem !== null && itemData.itemTypeRaw === 'attachment';
				if(!isAttachmentOnAttachment && item.files && item.files.length) {
					dispatch(createAttachmentsFromDropped(item.files, { collection, parentItem }));
				}
			}
			if(itemType === ATTACHMENT) {
				return dropZone === null ? { item: itemKey } : { collection: collectionKey };
			}
		},
		hover: (item, monitor) => {
			if(ref.current && monitor.getClientOffset()) {
				const cursor = monitor.getClientOffset();
				const rect = ref.current.getBoundingClientRect();
				const offsetTop = cursor.y - rect.y;
				const offsetBottom = (rect.y + rect.height) - cursor.y;
				const margin = itemData.itemTypeRaw === 'attachment' ? Math.floor(rect.height / 2) : DROP_MARGIN_EDGE;

				if(offsetTop < margin) {
					setDropZone('top');
				} else if(offsetBottom < margin) {
					setDropZone('bottom');
				} else {
					setDropZone(null);
				}
			}
		}
	});

	const className = cx('item', {
		odd: (index + 1) % 2 === 1,
		'nth-4n-1': (index + 2) % 4 === 0,
		'nth-4n': (index + 1) % 4 === 0,
		active: isActive,
		'dnd-target': canDrop && itemData && itemData.itemTypeRaw !== 'attachment' && isOver && dropZone === null,
		'dnd-target-top': canDrop && isOver && dropZone === 'top',
		'dnd-target-bottom': canDrop && isOver && dropZone === 'bottom',
	});

	//@NOTE: In order to allow item selection on "mousedown" (#161)
	//		 this event fires twice, once on "mousedown", once on "click".
	//		 Click events are discarded unless "mousedown" could
	//		 have been triggered as a drag event in which case "mousedown"
	//		 is ignored and "click" is used instead, if occurs.
	const handleMouseEvent = event => {
		if(itemData) {
			const isSelected = selectedItemKeys.includes(itemKey);
			if(selectedItemKeys.length > 1 &&
				isSelected && event.type === 'mousedown') {
				// ignore a "mousedown" when user might want to drag items
				return;
			} else {
				if(selectedItemKeys.length > 1 && isSelected &&
					event.type === 'click') {
					const isFollowUp = itemKey in ignoreClicks.current &&
						Date.now() - ignoreClicks.current[itemKey] < 500;

					if(isFollowUp) {
						// ignore a follow-up click, it has been handled as "mousedown"
						return;
					} else {
						// handle a "click" event that has been missed by "mousedown" handler
						// in anticipation of potential drag that has never happened
						selectItem(itemKey, event, keys, selectedItemKeys, dispatch);
						delete ignoreClicks.current[itemKey];
						return
					}
				}
				//@TODO: handle double click to open attachment
				// if(event.type === 'dblclick' && item.attachmentItemKey) {
				// 	openAttachment(item.attachmentItemKey, getAttachmentUrl, true);
				// }
			}
			if(event.type === 'mousedown') {
				// finally handle mousedowns as select events
				ignoreClicks.current[itemKey] = Date.now();
				selectItem(itemKey, event, keys, selectedItemKeys, dispatch);
			}
		}
	}

	useEffect(() => {
		preview(getEmptyImage(), { captureDraggingState: true })
	}, []);

	useEffect(() => {
		onFileHoverOnRow(isOver, dropZone);
	}, [isOver, dropZone]);

	return drag(drop(
		<div
			ref={ ref }
			className={ className }
			style={ style }
			data-index={ index }
			onClick={ handleMouseEvent }
			onDoubleClick={ handleMouseEvent }
			onMouseDown={ handleMouseEvent }
		>
			{ columns.map((c, colIndex) => itemData ? (
				<DataCell
					key={ c.field }
					colIndex={ colIndex }
					columnName={ c.field }
					isActive={ isActive }
					isFocused={ isFocused }
					itemData={ itemData }
					width={ `var(--col-${colIndex}-width)` }
				/>
			) : <PlaceholderCell
				key={ c.field }
				width={ `var(--col-${colIndex}-width)` }
				colIndex={ colIndex }
				columnName={ c.field }
			/> ) }
		</div>
	));
});

const Table = props => {
	const containerDom = useRef(null);
	const headerRef = useRef(null);
	const tableRef = useRef(null);
	const loader = useRef(null);
	const resizing = useRef(null);
	const reordering = useRef(null);
	const [isResizing, setIsResizing] = useState(false);
	const [isReordering, setIsReordering] = useState(false);
	const [reorderTargetIndex, setReorderTargetIndex] = useState(null);
	const [isFocused, setIsFocused] = useState(false);
	const [isHoveringBetweenRows, setIsHoveringBetweenRows] = useState(false);
	const { hasChecked, isFetching, keys, totalResults } = useSourceData();
	const collectionKey = useSelector(state => state.current.collectionKey);
	const libraryKey = useSelector(state => state.current.libraryKey);
	const columnsData = useSelector(state => state.preferences.columns, shallowEqual);
	const selectedItemKeys = useSelector(state => state.current.itemKey ?
		[state.current.itemKey] : state.current.itemKeys,
		shallowEqual
	);
	const columns = useMemo(() => columnsData.filter(c => c.isVisible), [columnsData]);
	const { field: sortBy, sort: sortDirection } = useMemo(() =>
		columnsData.find(column => 'sort' in column) || { field: 'title', sort: 'ASC' },
		[columnsData]
	);

	const dispatch = useDispatch();

	const [{ isOver, canDrop }, drop] = useDrop({
		accept: [ATTACHMENT, NativeTypes.FILE],
		collect: monitor => ({
			isOver: monitor.isOver({ shallow: true }),
			canDrop: monitor.canDrop(),
		}),
		drop: (props, monitor) => {
			if(monitor.isOver({ shallow: true })) { //ignore if dropped on a row (which is handled there)
				const itemType = monitor.getItemType();
				const item = monitor.getItem();

				if(itemType === ATTACHMENT) {
					return { collection: collectionKey, library: libraryKey };
				}

				if(itemType === NativeTypes.FILE) {
					dispatch(createAttachmentsFromDropped(item.files, { collection: collectionKey }));
					return;
				}
			}
		}
	});

	const handleFocus = useCallback(ev => {
		if(ev.currentTarget !== ev.target) {
			return;
		}
		ev.preventDefault();
		if(selectedItemKeys.length === 0 && keys.length > 0) {
			dispatch(navigate({
				items: [keys[0]]
			}));
		}
		setIsFocused(true);
	});

	const handleBlur = useCallback(() => {
		setIsFocused(false);
	});

	const handleIsItemLoaded = useCallback(index => keys && !!keys[index]);
	const handleLoadMore = useCallback((startIndex, stopIndex) => {
		dispatch(fetchSource(startIndex, stopIndex))
	});

	const handleKeyDown = useCallback(ev => {
		var vector;
		if(ev.key === 'ArrowUp') {
			vector = -1;
		} else if(ev.key === 'ArrowDown') {
			vector = 1;
		} else if(ev.key === 'Backspace') {
			dispatch(chunkedTrashOrDelete(selectedItemKeys));
			dispatch(navigate({ items: [] }));
			return;
		} else {
			return;
		}

		if(!vector) {
			return;
		}

		ev.preventDefault();

		const lastItemKey = selectedItemKeys[selectedItemKeys.length - 1];
		const index = keys.findIndex(key => key && key === lastItemKey);
		const nextIndex = index + vector;

		//check bounds
		if(vector > 0 && index + 1 >= keys.length) {
			return;
		}

		var nextKeys;

		if(vector < 0 && index + vector < 0) {
			if(!ev.getModifierState('Shift')) {
				nextKeys = [];
				setIsFocused(false);
				headerRef.current.focus();
			}
		} else {
			if(ev.getModifierState('Shift')) {
				if(selectedItemKeys.includes(keys[nextIndex])) {
					if(keys.slice(...(vector > 0 ? [0, index] : [index + 1])).some(
						key => selectedItemKeys.includes(key)
					)) {
						let offset = 1;
						let boundry = vector > 0 ? keys.length - 1 : 0;
						while(index + (offset * vector) !== boundry &&
							selectedItemKeys.includes(keys[index + (offset * vector)].key)
						) {
							offset++;
						}
						var consecutiveCounter = 1;
						while(selectedItemKeys.includes(keys[index + (offset * vector) + consecutiveCounter].key)) {
							consecutiveCounter++;
						}
						var consecutiveKeys;
						if(vector > 0) {
							consecutiveKeys = keys.slice(index + offset - consecutiveCounter + 1, index + offset);
						} else {
							consecutiveKeys = keys.slice(index - offset, index - offset + consecutiveCounter).reverse();
						}
						nextKeys = [
							...selectedItemKeys.filter(k => !consecutiveKeys.includes(k)),
							...consecutiveKeys,
							keys[index + (offset * vector)]
						];
					} else {
						nextKeys = selectedItemKeys.filter(k => k !== keys[index]);
					}
				} else {
					nextKeys = [...selectedItemKeys, keys[nextIndex]];
				}
			} else {
				nextKeys = [keys[nextIndex]];
			}
		}
		dispatch(navigate({ items: nextKeys }));
	});

	const handleResize = useCallback(ev => {
		const columnDom = ev.target.closest(['[data-colindex]']);
		const index = columnDom.dataset.colindex - 1;
		const { width } = containerDom.current.getBoundingClientRect();
		setIsResizing(true);
		resizing.current = { origin: ev.clientX, index, width };
	});

	const handleReorder = useCallback(ev => {
		const columnDom = ev.target.closest(['[data-colindex]']);
		const index = columnDom.dataset.colindex;
		const { left, width } = containerDom.current.getBoundingClientRect();
		setIsReordering(true);
		reordering.current = { index, left, width };
	});

	const handleMouseMove = useCallback(ev => {
		if(resizing.current !== null) {
			const { origin, index, width } = resizing.current;
			const offsetPixels = ev.clientX - origin;
			const offset = offsetPixels / width;
			const newColumns = columns.map(c => ({ ...c }));
			newColumns[index].fraction = Math.max(
				columns[index].fraction + offset,
				columns[index].minFraction
			);
			resizeVisibleColumns2(newColumns, -offset, true);

			resizing.current.newColumns = newColumns;
			const style = getColumnCssVars(newColumns, width);

			Object.entries(style).forEach(([name, value]) =>
				tableRef.current.style.setProperty(name, value)
			);
		} else if(reordering.current !== null) {
			const { index, left, width } = reordering.current;
			var targetIndex;
			if(ev.clientX < left) {
				targetIndex = 0;
			} else {
				let columnLeft = left;
				for (let i = 0; i < columns.length; i++) {
					const columnWidth = columns[i].fraction * width;
					columnLeft += columnWidth;
					const testOffest = columnLeft - 0.5 * columnWidth;
					if(ev.clientX < testOffest) {
						targetIndex = i;
						break;
					}
				}
			}
			if(targetIndex !== index) {
				setReorderTargetIndex(targetIndex);
			}
		}
	});
	const handleMouseUp = useCallback(ev => {
		if(isResizing) {
			ev.preventDefault();
			dispatch(preferenceChange('columns', resizing.current.newColumns));
		} else if(isReordering) {
			const indexFrom = reordering.current.index;
			const indexTo = reorderTargetIndex;


			if(columns[indexFrom] && columns[indexTo]) {
				const newColumns = columns.map(c => ({ ...c }));
				newColumns.splice(indexTo, 0, newColumns.splice(indexFrom, 1)[0]);
				dispatch(preferenceChange('columns', newColumns));
			}
		}

		resizing.current = null;
		reordering.current = null;

		setTimeout(() => { setIsResizing(false); setIsReordering(false); setReorderTargetIndex(null) });
	});

	const handleMouseLeave = useCallback(ev => {
		setIsReordering(false);
		setIsResizing(false);
		setReorderTargetIndex(null);
		resizing.current = null;
		reordering.current = null;
	});

	const handleFileHoverOnRow = useCallback((isOverRow, dropZone) => {
		setIsHoveringBetweenRows(isOverRow && dropZone !== null);
	});

	useEffect(() => {
		if(!hasChecked && !isFetching) {
			dispatch(fetchSource(0, 50));
		}
	}, []);

	useEffect(() => {
		if(loader.current) {
			loader.current.resetloadMoreItemsCache(true);
		}
	}, [sortBy, sortDirection, totalResults]);

	useEffect(() => {
		// register global mouse events so that dragging outside of table doesn't break resizing/reordering
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseleave', handleMouseLeave);
		return () => {
			document.removeEventListener('mouseup', handleMouseUp)
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
		}
		// new event handlers need to be installed every time any of these changes
		// otherwise it will have access to old values
	}, [isResizing, isReordering, columns, reorderTargetIndex]);

	return drop(
		<div
			ref={ containerDom }
			onKeyDown={ handleKeyDown }
			className={cx('items-table-wrap', {
				resizing: isResizing,
				reordering: isReordering,
				'dnd-target': (isOver && canDrop) || isHoveringBetweenRows
			}) }
		>
			{ hasChecked ? (
				<AutoSizer>
				{({ height, width }) => (
					<InfiniteLoader
						ref={ loader }
						isItemLoaded={ handleIsItemLoaded }
						itemCount={ totalResults }
						loadMoreItems={ handleLoadMore }
					>
						{({ onItemsRendered, ref }) => (
							<div
								ref={ tableRef }
								className="items-table"
								onFocus={ handleFocus }
								onBlur={ handleBlur }
								tabIndex={ 0 }
								onKeyDown={ handleKeyDown }
								style={ getColumnCssVars(columns, width) }
							>
								<HeaderRow
									ref={ headerRef }
									columns={ columns }
									sortBy={ sortBy }
									sortDirection={ sortDirection }
									width={ width }
									onResize={ handleResize }
									onReorder={ handleReorder }
									isResizing={ isResizing }
									isReordering={ isReordering }
									reorderTargetIndex= { reorderTargetIndex }
								/>
								<List
									className="items-table-body"
									height={ height }
									itemCount={ totalResults }
									itemData={ { onFileHoverOnRow: handleFileHoverOnRow, isFocused, columns, width, keys } }
									itemSize={ ROWHEIGHT }
									onItemsRendered={ onItemsRendered }
									ref={ ref }
									width={ width }
								>
									{ Row }
								</List>
							</div>
						)}
					</InfiniteLoader>
				)}
				</AutoSizer>
			) : null }
		</div>
	)
}

export default Table;