namespace AddressBook.Contracts.Models;

/// <summary>
/// Response model for deleting a contact by ID.
/// </summary>
/// <param name="Success"></param>
public record DeleteContactByIdResponse(bool Success);