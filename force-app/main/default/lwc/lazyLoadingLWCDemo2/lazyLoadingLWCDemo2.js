// LazyLoadingLWCDemo2.js

import { LightningElement, track, wire,api } from 'lwc';

import getAccounts from '@salesforce/apex/LazyLoadingController.getAccounts';
import getPicklistValues from '@salesforce/apex/LazyLoadingController.getPicklistValues';
import { updateRecord } from 'lightning/uiRecordApi';
import getAccounts2 from '@salesforce/apex/LazyLoadingController.getAccounts2';
import updateAccount from '@salesforce/apex/LazyLoadingController.updateAccount';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    { label: 'Id', fieldName: 'Id', type: 'Id', sortable: true, value:"Id", editable:false },
    { label: 'Name', fieldName: 'Name', type: 'text', editable: true, sortable: true, value:"Name",editable:true },
    {
                label: 'Rating', fieldName: 'Rating', type: 'picklist',editable:true,sortable:true,value:"Rating", typeAttributes: {
                    placeholder: 'Choose rating', options: [
                        { label: 'Hot', value: 'Hot' },
                        { label: 'Warm', value: 'Warm' },
                        { label: 'Cold', value: 'Cold' },
                    ] // list of all picklist options
                    , value: { fieldName: 'Rating' } // default value for picklist
                    , context: { fieldName: 'Id' } // binding account Id with context variable to be returned back
                }
            },
    { label: 'Account Reference', fieldName: 'AccountReference__c', type: 'text', sortable: true, editable: false, value:"Account Reference" ,}
];






export default class LazyLoadingLWCDemo2 extends LightningElement {
    @track accounts = [];
    objApiName = 'Account';
    fieldApiName = '';
    filterValue; //used for filters
    


    @track copyAccounts;
    @track totalReferences = [];
    @track error;
    @track updatedDrafts = [];
    columns = columns;
    rowLimit = 200;
    pageSize = 200;
    rowOffSet = 0;
    reference;
    sortBy;
    sortDirection;
    sortingType = 'AccountReference__c ASC';
    updatedAccounts;
    filterName; // used for search


    showSpinner = false;
    fieldApiNameType =''
    operatorValue = 'equals'
    
    @track textDataType = ['equals', 'not equal to', 'less than', 'greater than','less or equal', 'greater or equal', 'contains','does not contain', 'starts with'];
    @track currencyDataType = ['equals', 'not equal to', 'less than', 'greater than','less or equal', 'greater or equal'];
    @track checkboxDataType = ['equals', 'not equal to'];

    
    
    get operatorOptions (){
    console.log('this.fieldApiNameType-->',this.fieldApiNameType);
     switch(this.fieldApiNameType){
         case 'text':
         case 'Id':
         case 'picklist':
            let values = this.textDataType.map(option=>({ label: option, value: option }));
            // console.log('values-->',JSON.stringify(values));
            return values;
        
           

         default:
            return []
     }
        
   
    } 

    


    @track filters = [];
    @track ownershipFilter = 'All'; // Default to All records
    @track filterLogic = '1 AND 2'; // Default filter logic

    @wire(getPicklistValues,{ objectApiName: 'Account', fieldApiName: 'Rating'})
    wiredPicklistValues({ error, data }) {
        if (data) {
            console.log('in the data')
            // Set the picklist options received from Apex to your component property
            let values = data.map(option => ({ label: option, value: option }));
            this.picklistOptions = JSON.parse(JSON.stringify(values));
            // console.log('picklistOptions-->',JSON.stringify(this.picklistOptions));
            // console.log('columns-->',JSON.stringify(this.columns));
            this.fieldApiName = this.columns[0].label;
            const selectedColumn = this.columns.find(column => column.label === this.fieldApiName);
            // console.log('selectedColumn-->',JSON.stringify(selectedColumn));
            if (selectedColumn) {
                this.fieldApiNameType = selectedColumn.type;
            }else{
                this.fieldApiNameType = '';
            }
            
        } else if (error) {
            console.error('Error fetching picklist values:', error);
        }
    }

    // Method to add a new filter
    addFilter() {
        this.filters.push({
            fieldApiName: '',
            operator: '',
            value: ''
        });
    }


    // Method to remove a filter
    removeFilter(index) {
        this.filters.splice(index, 1);
    }

    // Method to apply filters
    applyFilter() {
        
        this.filters.push({
            fieldApiName: this.fieldApiName,
            operator: this.operatorValue,
            value: this.selectedFilterValue
        });
        this.fieldApiName ='';
        this.operatorValue = '';
        this.selectedFilterValue = '';


        console.log('line 144')
        this.template.querySelector('.fieldApiName').value ='';
        console.log('line 146')

        this.template.querySelector('.operatorValue').value ='';
        this.template.querySelector('.filterValue').value ='';
        console.log('line 150')
        this.loadData();
        // console.log('this.filters-->',JSON.stringify(this.filters));
    }

    // Method to handle change in ownership filter
    handleOwnershipChange(event) {
        this.ownershipFilter = event.target.value;
    }

    removeSelectedFilter(event){
        let index = event.target.index;
        console.log('event index-->',event.target.index);
        this.filters.splice(index,index+1);
        console.log('this.filters-->',JSON.stringify(this.filters));
        this.loadData();
    }

   
    // Method to handle field change

    handleFieldChange(event) {
        console.log('event-->',event);

        const selectedFieldApiName = event.detail.value;
       
        this.fieldApiName = selectedFieldApiName;
        const selectedColumn = this.columns.find(column => column.label === selectedFieldApiName);
        console.log('selectedColumn-->',JSON.stringify(selectedColumn));
        if (selectedColumn) {
            this.fieldApiNameType = selectedColumn.type;
        }else{
            this.fieldApiNameType = '';
        }

        
        
        // const index = event.target.dataset.index;
        // this.filters[index].fieldApiName = event.target.value;
    }

    handleOperatorChange(event){

        console.log('event-->',event);
        this.operatorValue = event.detail.value;
        console.log('this.operatorValue-->',this.operatorValue);

        // const value = event.target.value;
    }

    

    // Method to handle value change
    selectedFilterValue='';
    handleValueChange(event) {
       const value = event.detail.value;
        this.selectedFilterValue = value;
       console.log('value-->',value);
    }
    

    // Method to handle filter logic change
    handleFilterLogicChange(event) {
        this.filterLogic = event.target.value;
    }


    handleToggle(event) {
        console.log('line 220')
        

        const classList = this.template.querySelector('.inlineEditor').classList; 
        let isChecked = false;  
        if(classList.contains('inlineEditorCheck')){
            this.template.querySelector('.inlineEditor').classList.add('inlineEditorUncheck')
            this.template.querySelector('.inlineEditor').classList.remove('inlineEditorCheck')
            isChecked = false;
        }else{
            this.template.querySelector('.inlineEditor').classList.add('inlineEditorCheck')
            this.template.querySelector('.inlineEditor').classList.remove('inlineEditorUncheck')
            isChecked = true;
        }
       
        
        // const isChecked = event.detail.checked;
        this.columns = this.columns.map(column => {
            if (!isChecked || column.label === 'Id' || column.label === 'Account Reference') {
                return { ...column, editable: false };
            } else {
                return { ...column, editable: true };
            }
        });

        // this.cancelHandleAction();
        // console.log('this.account-->', JSON.stringify(this.accounts));


        // try{

        // this.template.querySelector('lightning-datatbale').columns = this.columns;
        // }catch(err){
        //     console.log('err-->',JSON.stringify(err));
        // }
        // console.log('this.columns-->',JSON.stringify(this.columns));
    }

    
    controlListView(){
        if(this.template.querySelector('.controlListViewDropdown').style.display == 'block'){
            this.template.querySelector('.controlListViewDropdown').style.display = 'none';
    
        }else{
            this.template.querySelector('.controlListViewDropdown').style.display = 'block';
    
        }
    }
    


    handleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortingType = this.sortBy + ' ' + this.sortDirection;
        // console.log('this.sortBy-->', this.sortBy);
        // console.log('this.sortDirection-->', this.sortDirection);
        // Perform sorting logic here (e.g., call Apex method to fetch sorted data)
        this.loadData();
    }

    // constructor() {
    // super();
    // this.handleDocumentClick = this.handleDocumentClick.bind(this);
    // }


    connectedCallback() {
       
        this.loadData();
    }

    disconnectedCallback() {
       
    }

    

    showFilterType = false;

    changeSearchFilter(){
        // const display = this.template.querySelector('.slds-dropdown').style.display;
        // if(display=='none'){
        //     this.template.querySelector('.slds-dropdown').style.display = 'block';
        // }else{
        //     this.template.querySelector('.slds-dropdown').style.display = 'none';

        // }

        // console.log('this.template.querySelector->',this.template.querySelector('.slds-dropdown'))
        this.showFilterType = !(this.showFilterType); 
    }

    @track defaultSearchInput = 'Name'
    get searchInputLabel(){ return 'Search By '+this.defaultSearchInput;}

    handleSearchSetup(event){
        console.log('event setup-->',event);
        console.log('label--->',event.currentTarget.dataset.id);
        this.defaultSearchInput = event.currentTarget.dataset.id;
        console.log('defaultSearchInput-->',this.defaultSearchInput);
        console.log('searchInputLabel-->',this.searchInputLabel);
        this.template.querySelector('.slds-dropdown').style.display = 'none';

        // this.showFilterType = false;

       
    }

    handleSearch(event) {
        console.log('Value Input-->',event.target.value);
        this.filterName = [{
            fieldApiName:this.defaultSearchInput,
            operator: 'contains',
            value: event.target.value
        }]
        console.log('filterName--->',JSON.stringify(this.filterName));
        // this.filterName = event.target.value;
        this.showSpinner = true;
        this.loadData().then(res => {
            this.showSpinner = false;
        }).catch(err => {
            this.showSpinner = false;
            console.error('err-->', err);
        })
        // this.refreshDataTable();





    }

    // @wire(getAccounts, { limitSize: '$rowLimit', sortingType: '$sortingType' })
    // wiredData({ data, error }) {
    //     if (data) {
    //         this.totalReferences = data.map(item => item.AccountReference__c);
    //         this.reference = data[this.rowLimit - 1].AccountReference__c;
    //         this.accounts = [...data];
    //         this.error = undefined;
    //     } else if (error) {
    //         this.error = error;
    //         console.error('Error:', error);
    //         this.accounts = undefined;
    //     }
    // }

    loadData() {
        console.log('filterName-->',this.filterName)
        console.log('this.filters-->',JSON.stringify(this.filters))
        return getAccounts({ limitSize: this.rowLimit, sortingType: this.sortingType, filterName: this.filterName, extraFilter : this.filters })
            .then(result => {
                this.totalReferences = result.map(item =>
                    item.Id);

                // console.log('this.totalReferences-->', this.totalReferences[0]);
                // this.reference = result[this.rowLimit - 1].AccountReference__c;
                let updatedRecords = [...result];
                // console.log('accounts-->', this.accounts.length)
                this.accounts = updatedRecords;
                // console.log('accounts after-->', this.accounts.length)
                //new
                    // this.accounts.forEach(ele=>{
                    //     ele.picklistOptions = this.picklistOptions;
                    // })

                this.copyAccounts = JSON.parse(JSON.stringify(this.accounts));
                this.error = undefined;
                const dataTable = this.template.querySelector('lightning-datatable');
                if (dataTable) {
                    dataTable.enableInfiniteLoading = this.accounts.length >= this.pageSize;
                }


            })
            .catch(error => {
                this.error = error;
                console.log('error-->', JSON.stringify(error));
                this.accounts = undefined;
            });
    }
    loadData2() {

        return getAccounts2({ limitSize: this.rowLimit, reference: this.reference, sortingType: this.sortingType, totalReferences: this.totalReferences, filterName: this.filterName })
            .then(result => {
                this.totalReferences = [...this.totalReferences, ...result.map(item => item.Id)];
                // this.reference = result[this.rowLimit - 1].AccountReference__c;
                // console.log('this.reference-->', this.reference);
                let updatedRecords = [...this.accounts, ...result];
                this.accounts = updatedRecords;
                this.copyAccounts = JSON.parse(JSON.stringify(this.accounts));
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                console.log('error-->', error);
                this.accounts = undefined;
            });
    }


    cancelHandleAction(event) {




        // console.log('copy-->', JSON.stringify(this.copyAccounts[0]))
        // console.log('acc-->', JSON.stringify(this.accounts[0]))

        // Deselect the rows by setting the selectedRows attribute to an empty array
        this.template.querySelector('lightning-datatable').selectedRows = [];

        // Optionally, you can also clear the row index
        this.template.querySelector('lightning-datatable').selectedRowIndexes = [];

        // Optionally, you can also reset the draftValues array
        this.template.querySelector('lightning-datatable').draftValues = [];
        this.updatedDrafts = [];
        // console.log('draftValues-->')
    }

    saveHandleAction(event) {
        this.updatedDrafts = event.detail.draftValues;
        // console.log('updatedDrafts-->', this.updatedDrafts);
        const inputsItems = this.updatedDrafts.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
        // this.accounts = this.updatedDrafts.map(item=>
        // this.accounts
        // );
        // console.log('inputsItems-->', inputsItems);


        this.showSpinner = true;
        const promises = inputsItems.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records Updated Successfully!!',
                    variant: 'success'
                })
            );
            // console.log('this.copyAccounts-->',JSON.parse(this.copyAccounts));
            this.accounts = JSON.parse(JSON.stringify(this.copyAccounts))
            this.updatedDrafts = [];
            // Deselect the rows by setting the selectedRows attribute to an empty array
            this.template.querySelector('lightning-datatable').selectedRows = [];

            // Optionally, you can also clear the row index
            this.template.querySelector('lightning-datatable').selectedRowIndexes = [];

            // Optionally, you can also reset the draftValues array
            this.template.querySelector('lightning-datatable').draftValues = [];
            // console.log('line 170')
            this.showSpinner = false;

            // const updateList = this.updatedDrafts.map(item=>{
            //     console.log('item-->',item);

            //     const index = this.accounts.findIndex(acc => acc.Id === item.Id);
            //     console.log('index-->',index);
            // })
            //const index = this.accounts.findIndex(acc => acc.Id === rowId);
            // return this.refresh();
        }).catch(error => {
            console.log('error-->', JSON.stringify(error));
            // this.dispatchEvent(
            //     new ShowToastEvent({
            //         title: 'Error',
            //         message: 'An Error Occured!!',
            //         variant: 'error'
            //     })
            // );
        }).finally(() => {
            this.updatedDrafts = [];
        });
    }



    async refresh() {
        await refreshApex(this.accounts);
    }



    handleCellChange(event) {
        // console.log('copy cellChange before-->', JSON.stringify(this.copyAccounts[0]))
        // console.log('acc cellChange before-->', JSON.stringify(this.accounts[0]))
        // console.log('event-->', event);
        event.detail.draftValues.forEach(draftValue => {
            // console.log('draftValue-->', draftValue);
            const rowId = draftValue.Id;
            // const updatedValue = draftValues.Name;
            // console.log('rowId-->', rowId);
            const index = this.accounts.findIndex(acc => acc.Id === rowId);
            // console.log('index-->', index)
            if (index !== -1) {
                let updatedAccount = { ...this.copyAccounts[index] };

                for (let key in draftValue) {
                    updatedAccount[key] = draftValue[key];
                }
                this.copyAccounts[index] = updatedAccount;

            }
            // console.log('copy Acc in cell-->',JSON.stringify(this.copyAccounts));
        });

        // console.log('copy cellChange-->', JSON.stringify(this.copyAccounts[0]))
        // console.log('acc cellChange-->', JSON.stringify(this.accounts[0]))





        // // this.updatedDrafts =[...this.updatedDrafts, ...event.detail.draftValues];
        // const updatedValue = event.detail.draftValues[0].Name;
        // const rowId = event.detail.draftValues[0].Id;
        // console.log('updatedValue-->',updatedValue);
        // console.log('rowId-->',rowId);
        // // Find the index of the record to be updated
        // const index = this.accounts.findIndex(acc => acc.Id === rowId);
        // console.log('index-->',index)

        // if (index !== -1) {
        //     // Clone the array and update the specific record
        //     this.updatedAccounts = [...this.copyAccounts];

        //         for(let key in event.detail.draftValues[0]){
        //             console.log('key-->',key);
        //             // const index = this.accounts.findIndex(acc => acc.Id === rowId);
        //             console.log('event.detail.draftValues[0].key-->',event.detail.draftValues[0][key])
        //             this.updatedAccounts[index] = { ...this.updatedAccounts[index], [key]: event.detail.draftValues[0][key] };
        //             console.log('this.updatedAccounts[index]-->',JSON.stringify(this.updatedAccounts[index]));
        //         }   

        //     // this.updatedAccounts[index] = { ...this.updatedAccounts[index], Name: updatedValue };
        //     // console.log('updatedAccounts-->',this.updatedAccounts);
        //     this.copyAccounts = this.updatedAccounts;
        //     // console.log('copyAccounts-->',JSON.stringify(this.copyAccounts))

        //     // Save the changes to the database
        //     // updateAccount({ accountId: rowId, newFirstName: updatedValue })
        //     //     .then(() => {
        //     //         this.accounts = updatedAccounts;
        //     //         this.updatedDrafts = [];
        //     //     })
        //     //     .catch(error => {
        //     //         // Handle any errors (e.g., display an error message)
        //     //         console.error('Error updating account:', error);
        //     //     });
        // }
    }



    loadMoreData(event) {
        // console.log('event-->', event);
        // console.log('accounts length-->', this.accounts.length);
        if (this.accounts.length < this.pageSize) {
            const baseTableEle = this.template.querySelector('lightning-datatable')
            // console.log('baseTableEle-->', baseTableEle)
            if (baseTableEle) {
                // console.log("In the load")
                baseTableEle.enableInfiniteLoading = false


            }
        } else {

            console.log("In the load more")
            const currentRecord = this.accounts;
            const { target } = event;
            // const { target } = event;
            target.isLoading = true;
            // this.rowOffSet = this.rowOffSet + this.rowLimit;
            this.loadData2()
                .then(() => {
                    target.isLoading = false;
                });
        }
    }
}