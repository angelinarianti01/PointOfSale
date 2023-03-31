import { JTML } from "https://joshprojects.site/JTML_Module.js";

class Table {
	dataArray;
	container;
	headings;
	allowEditing = false;
	allowDeleting = false;
	onUpdate = ()=>{};
	onDelete = ()=>{};

	constructor(dataArray, containerAsString, optionsObject) {
		this.dataArray = dataArray;

		this.container = new JTML('table')
			.appendTo(new JTML(containerAsString))

		this.headings = new JTML('tr')
			.appendTo(this.container);

		for (const [key, value] of Object.entries(dataArray[0])) {
			let itemHeading = new JTML('th')
				.html(key)
				.class('tableHeading')
				.appendTo(this.headings);
		}

		this.allowEditing = optionsObject?.allowEditing;
		this.allowDeleting = optionsObject?.allowDeleting;
		this.render();
	}

	getHeadings() {
		return this.headings.children().map((singleElement) => {
			return singleElement.getHtml();
		});
	}

	setAllowEditing(value) {
		this.allowEditing = value;
	}

	setAllowDeleting(value) {
		this.allowDeleting = value;
	}

	render() {
		this.dataArray.forEach((singleRowObj) => {
		let currentRow = new Row(singleRowObj, this.container, this);
		})
	}

	on(event, callbackFunction) {
		if (event =='update') {
			this.onUpdate = callbackFunction;
		} else if (event =='delete') {
			this.onDelete = callbackFunction;
		} else {
			return new Error('not aware of this event');
		}
	}
}

class Row {
	parentTable;
	container;
	editButton;
	deleteButton;

	constructor(rowObj, container, parentTable) {
		this.parentTable = parentTable;

		this.container = new JTML('tr')
			.appendTo(container);

		let headings = this.parentTable.getHeadings();

		headings.forEach((singleHeading)=>{
			let rowItem = new JTML('td')
				.html(rowObj[singleHeading])
				.class('jtml_td')
				.appendTo(this.container);
		})

		if (this.parentTable.allowEditing) {
			let editCol = new JTML('td')
				.class('jtml_td')
				.appendTo(this.container);
			this.editButton = new JTML('button')
				.html('edit')
				.class('editButton')
				.appendTo(editCol)
				.on('click',()=>{
					this.renderAsEditable();
				},{once:true})
		}

		if (this.parentTable.allowDeleting) {
			let deleteCol = new JTML('td')
				.class('jtml_td')
				.appendTo(this.container);
			this.deleteButton = new JTML('button')
				.html('delete')
				.class('deleteButton')
				.appendTo(deleteCol)
				.on('click',()=>{
					console.log("deleting...");
					console.log(rowObj);
					this.deleteData();
				},{once:true})
		}
	}

	renderAsEditable() {
		this.container.children().forEach((singleChild)=>{
			if (singleChild.children().length == 0) {
				singleChild.set('contenteditable',"true")
				.class('editableField');
			}
		})

		this.editButton.html('save')
			.on('click',()=>{
				this.saveData();
			})
	}

	getElementByHeading(heading) {
		let headings = this.parentTable.getHeadings();
		let tds = this.container.children();
		for (let i = 0; i < headings.length; i++) {
			if (headings[i] == heading) {
				return tds[i].getHtml();
			}
		}
	}

	getRowData() {
		let dataObj = {};
		let headings = this.parentTable.getHeadings();

		headings.forEach((singleHeading)=>{
			dataObj[singleHeading] = this.getElementByHeading(singleHeading);
		})

		return dataObj;
	}

	saveData() {
		let tempObj = this.getRowData();
		this.parentTable.onUpdate(tempObj);
	}

	deleteData() {
		this.container.css({
			'display':'none'
		})
		console.log('delete the data here');
		this.parentTable.onDelete(this.getRowData());
		console.log(this.getRowData());
		console.log('and once it has been deleted from the database we visualise it as being gone')
		this.container.remove();
	}
}

export { Table };
