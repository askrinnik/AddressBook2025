# Functional Requirements Specification

## 1. Overview
The Address Book application will allow users to manage their contacts efficiently by storing relevant personal and contact details.

## 2. Entities and Attributes

### 2.1 Contact
Each contact represents an individual with the following attributes:
- **Id** (`integer`): Unique identifier for the contact.
- **OwnerId** (`integer`): Identifier of the user who owns this contact.
- **FirstName** (`string`, max **30** characters): First name of the contact.
- **LastName** (`string`, max **30** characters): Last name of the contact.
- **Birthday** (`Date`): Birthdate of the contact.

### 2.2 Phone
Each contact may have multiple phone numbers, with the following attributes:
- **Id** (`integer`): Unique identifier for the phone number.
- **ContactId** (`integer`): Identifier of the contact associated with this phone number.
- **OperatorId** (`integer`): Identifier of the phone operator.
- **PhoneNumber** (`string`, max **20** characters): The phone number itself.
- **Comment** (`string`, max **200** characters, optional): Additional notes regarding the phone number.

### 2.3 Phone Operator
Each phone number is associated with an operator, defined as follows:
- **Id** (`integer`): Unique identifier for the phone operator.
- **Name** (`string`, max **30** characters): Name of the phone operator.
- **Description** (`string`, max **200** characters): Description of the operator.

## 3. Functional Requirements
1. Users must be able to **create, read, update, and delete** contacts.
2. Each contact can have **multiple phone numbers**.
3. Users can associate phone numbers with **predefined phone operators**.
4. **Optional comments** can be added to each phone number.
5. The system must ensure **data integrity** by validating input lengths and formats.

## 4. Constraints
- The **maximum length** for string fields must be enforced.
- Each contact must have at least **one identifying field** (*FirstName* or *LastName*).
- **Phone numbers must be unique** per contact.

## 5. Future Enhancements
- Support for **email addresses**.
- Integration with **external contact synchronization services**.
- Custom **categories for contacts**.

---
This document serves as a foundation for the Address Book application development, ensuring structured data management and functionality.
