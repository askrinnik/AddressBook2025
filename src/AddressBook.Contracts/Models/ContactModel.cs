namespace AddressBook.Contracts.Models;

public record ContactModel(
  int Id,
  string FirstName,
  string LastName,
  DateTime? Birthday);