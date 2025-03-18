namespace AddressBook.Web.Domain;

public record Phone(
  int Id,
  int ContactId,
  Contact Contact,
  int PhoneOperatorId,
  string PhoneNumber,
  string Comment,
  PhoneOperator PhoneOperator
  );