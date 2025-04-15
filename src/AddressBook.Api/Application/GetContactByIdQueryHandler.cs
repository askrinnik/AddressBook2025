using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using MediatR;

namespace AddressBook.Api.Application;

internal class GetContactByIdQueryHandler(
  IRetrieve<ContactId, Contact> retrieve) : IRequestHandler<GetContactByIdQuery, ContactModel?>
{
  public async Task<ContactModel?> Handle(GetContactByIdQuery request, CancellationToken cancellationToken)
  {
    var contact = await retrieve.TryRetrieveAsync(new(request.Id));
    return contact == null
      ? null
      : new ContactModel(contact.Id.Value, contact.FirstName, contact.LastName, contact.Birthday);
  }
}