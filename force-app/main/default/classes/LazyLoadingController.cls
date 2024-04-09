public with sharing class LazyLoadingController {
    

    @AuraEnabled(cacheable=true)
    public static List<String> getPicklistValues(String objectApiName, String fieldApiName) {
        List<String> picklistValues = new List<String>();
        // Query the describe information to get picklist values
        Schema.DescribeFieldResult fieldResult = Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap().get(fieldApiName).getDescribe();
        if (fieldResult.getType() == Schema.DisplayType.PICKLIST) {
            for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
                picklistValues.add(entry.getLabel());
            }
        }
        System.debug('picklistValues-->'+picklistValues);
        return picklistValues;
    }

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts(Integer limitSize, String sortingType, List<Map<String, Object>> filterName, List<Map<String, Object>> extraFilter){
        if (sortingType != null ) {
            String query = 'SELECT Id, Name, Rating, CreatedDate, AccountReference__c FROM Account';
            if((filterName!=null && !filterName.isEmpty()) || (extraFilter!=null && !extraFilter.isEmpty())){
                query+= ' WHERE';
                if(filterName!=null && !filterName.isEmpty()){

                    for (Integer i = 0; i < filterName.size(); i++) {
                        String fieldApiName = (String)filterName[i].get('fieldApiName');
                        String operator = (String)filterName[i].get('operator');
                        switch on operator{
                            when 'contains'{
                                operator = 'LIKE';
                            }
                            when else{

                            }
                        }

                        String value = (String)filterName[i].get('value');
                        if(operator=='LIKE'){
                            value = '%' + value + '%';
                        }else{

                        }
                        
                        if (i > 0) {
                            query += ' AND';
                        }
                        query += ' ' + fieldApiName + ' ' + operator + ' \'' + value + '\'';
                    }
                }

                if(extraFilter!=null && !extraFilter.isEmpty()){
                    if(filterName!=null && !filterName.isEmpty()){
                        query+= ' AND';
                    }
                    else{

                    }
                    System.debug('extraFilter--->'+extraFilter);
                    for (Integer i = 0; i < extraFilter.size(); i++) {
                        String fieldApiName = (String)extraFilter[i].get('fieldApiName');
                        System.debug('line 56');
                        String operator = (String)extraFilter[i].get('operator');
                        System.debug('line 57');

                        switch on operator{
                            when 'contains'{
                                operator = 'LIKE';
                            }
                            when 'equals'{
                                operator = '=';
                            }
                            when 'not equal to'{
                                operator ='!=';
                            }
                            when 'less than'{
                                operator='<';
                            }
                            when 'greater than'{
                                operator='>';
                            }
                            when 'less or equal'{

                            }
                            when 'greater or equal'{

                            }
                            when 'does not contain'{

                            }
                            when else{

                            }
                        }

                        String value = (String)extraFilter[i].get('value');
                        if(operator=='LIKE'){
                            value = '%' + value + '%';
                        }else{
                            
                        }
                        
                        if (i > 0) {
                            query += ' AND';
                        }
                        query += ' ' + fieldApiName + ' ' + operator + ' \'' + value + '\'';
                        System.debug('query-->'+query);
                    }
                }

                System.debug('query-->'+query);
                System.debug('query-->'+query);
            }
            if (sortingType != null) {
                query += ' ORDER BY ' + sortingType;
            }
            query += ' LIMIT :limitSize';
            return Database.query(query);
        } else {
            // Handle invalid sortingType
            throw new AuraHandledException('Invalid sortingType');
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts2(Integer limitSize, String reference, String sortingType,List<String> totalReferences, String filterName) {
        // Ensure sortingType is a valid field name to prevent SOQL injection
        if (sortingType != null) {
            String query = 'SELECT Id, Name, Rating, CreatedDate, AccountReference__c FROM Account WHERE Id NOT IN :totalReferences';
            if(filterName!=null){
                query+= ' AND Name LIKE \'%' + filterName + '%\'';
            }
            if (sortingType != null) {
                query += ' ORDER BY ' + sortingType;
            }
            query += ' LIMIT :limitSize';
            System.debug('query-->'+query);
            return Database.query(query);
        } else {
            // Handle invalid sortingType
            throw new AuraHandledException('Invalid sortingType');
        }
    }
    
    
    @AuraEnabled
    public static void updateAccount(String accountId, String newFirstName) {
        try {
            Account accToUpdate = new Account(Id = accountId);
            accToUpdate.Name = newFirstName;
            update accToUpdate;
        } catch (Exception e) {
            // Handle any exceptions (e.g., log or return an error message)
            System.debug('Error updating account: ' + e.getMessage());
        }
    }
}