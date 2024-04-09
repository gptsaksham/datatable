import { LightningElement, track } from 'lwc';
export default class FilterModule {

// Define filter criteria structure
@track filters = [{
    fieldApiName: '',
    operator: '',
    value: ''
}];
@track ownershipFilter = 'All'; // Default to All records
@track filterLogic = '1 AND 2'; // Default filter logic

// Method to add a new filter
addFilter() {
    this.filters.push({
        fieldApiName: '',
        operator: '',
        value: ''
    });
}

constructor() {
        this.filters = [{
            fieldApiName: '',
            operator: '',
            value: ''
        }];
    }

    // Method to get the filters array
    getFilters() {
        return this.filters;
    }

// Method to remove a filter
removeFilter(index) {
    this.filters.splice(index, 1);
}

// Method to apply filters
applyFilters() {
    // Implement logic to fetch data using the filter criteria
}

// Method to handle change in ownership filter
handleOwnershipChange(event) {
    this.ownershipFilter = event.target.value;
}

// Method to handle field change
handleFieldChange(event) {
    const index = event.target.dataset.index;
    this.filters[index].fieldApiName = event.target.value;
}

// Method to handle operator change
handleOperatorChange(event) {
    const index = event.target.dataset.index;
    this.filters[index].operator = event.target.value;
}

// Method to handle value change
handleValueChange(event) {
    const index = event.target.dataset.index;
    this.filters[index].value = event.target.value;
}

// Method to handle filter logic change
handleFilterLogicChange(event) {
    this.filterLogic = event.target.value;
}


}