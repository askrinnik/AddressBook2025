namespace AddressBook.Web.Domain;

public record PhoneOperator(
  int Id,
  string Name,
  string Description,
  IReadOnlyCollection<Phone> Phones);