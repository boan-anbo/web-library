'use strict';

const React = require('react');
const keydown = require('react-keydown').default;
const PropTypes = require('prop-types');

const Item = require('../item');
const Spinner = require('../ui/spinner');

class ItemList extends React.Component {
	@keydown( 'down' )
	handleKeyDown() {
		let index = this.props.items.findIndex(item => item.key === this.props.selectedItemKey) + 1;
		if(this.props.items[index]) {
			this.props.onItemSelected(this.props.items[index].key);
		}
	}

	@keydown( 'up' )
	handleKeyUp() {
		let index = this.props.items.findIndex(item => item.key === this.props.selectedItemKey) - 1;
		if(this.props.items[index]) {
			this.props.onItemSelected(this.props.items[index].key);
		}
	}

	render() {
		if(this.props.isFetching) {
			return <Spinner />;
		} else {
			return (
				<div className="item-list-wrap">
					<table className="item-list-head hidden-touch hidden-sm-down">
						<thead>
							<tr>
								<th>Title</th>
								<th>Creator</th>
								<th>Year</th>
								<th className="hidden-touch hidden-sm-down">Date Modified</th>
								<th className="hidden-touch hidden-sm-down"></th>
								<th className="hidden-touch hidden-sm-down"></th>
							</tr>
						</thead>
					</table>
					<div className="item-list-body">
						<ul className="item list">
							{
								this.props.items.map(item => <Item
									onClick={ () => this.props.onItemSelected(item.key) }
									active= { item.key === this.props.selectedItemKey }
									key={ item.key }
									item={ item } />)
							}
						</ul>
					</div>
				</div>
			);
		}
	}
}

ItemList.propTypes = {
	items: PropTypes.array,
	selectedItemKey: PropTypes.string,
	isFetching: PropTypes.bool,
	onItemSelected: PropTypes.func
};

ItemList.defaultProps = {
	isFetching: false
};

module.exports = ItemList;
