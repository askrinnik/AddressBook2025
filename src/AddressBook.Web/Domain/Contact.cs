namespace AddressBook.Web.Domain;

public record Contact(
  int Id, 
  int OwnerId, 
  string FirstName, 
  string LastName, 
  DateTime? Birthday,
  IReadOnlyCollection<Phone> Phones);
