namespace AddressBook.Contracts.Models;

/// <summary>
/// Contact model
/// </summary>
/// <param name="Id">the contact ID.</param>
/// <param name="FirstName">first name</param>
/// <param name="LastName">last name</param>
/// <param name="Birthday">birthday</param>
public record ContactModel(
  int Id,
  string FirstName,
  string LastName,
  DateTime? Birthday);