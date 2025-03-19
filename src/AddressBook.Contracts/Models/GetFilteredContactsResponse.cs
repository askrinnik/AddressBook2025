namespace AddressBook.Contracts.Models;

public record GetFilteredContactsResponse(int TotalRows, IReadOnlyCollection<ContactModel> Rows);