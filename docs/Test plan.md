# **Test Plan of the Address Book**

## **1\. Test Plan Identifier**

AddBook-01

## **2\. Test object and description**

The goal of this Test Plan is to prepare test documentation and anticipate possible errors. Also, to ensure that all endpoints function correctly and efficiently under different conditions.  
To achieve the goal, the following tasks must be completed:

1. Prepare test documentation  
2. Check the application functions according to the documentation

**Description of the testing system:** The Address Book application will allow users to manage their contacts efficiently by storing relevant personal and contact details.

**Test environment:**  
OS: Windows/Linux/ Docker Container  
Browser: Google Chrome / Edge

## **3\. Functions to be tested**

1. View, create, update, delete contacts  
2. Add comments to contacts  
3. Working with backend  
4. Working with the database  
5. Filter contacts

## **4\. Functions not to be tested**

1. Authentication and authorization  
2. Performance

## **5\. Test approach**

1. Functional testing  
2. Integration testing

## **6\. Test path criteria**

1. All functional test cases pass without critical defects

## **7\. Suspension and Resumption Criteria**

**Suspension Criteria:**

1. Critical system failures preventing testing.  
2. Lack of required test environment or data.

**Resumption Criteria:**

1. Blocking issues are resolved.  
2. Updated test cases are reviewed and approved.  
3. Test environment is restored.

## **8\. Required Resources**

**Tools**: Swagger, Postman, DBeaver/SQL Server Management  
**Hardware**: Staging server matching production setup  
**Test Data**: 

## **9\. Roles and Responsibilities**

QA Engineer: Vira  
Developer: Alexander  
