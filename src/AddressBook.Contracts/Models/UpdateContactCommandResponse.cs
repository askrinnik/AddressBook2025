namespace AddressBook.Contracts.Models;

/// <summary>
/// Response model for updating a contact.
/// </summary>
/// <param name="Found">True if the contact was found and updated; false if not found.</param>
public record UpdateContactCommandResponse(bool Found);
