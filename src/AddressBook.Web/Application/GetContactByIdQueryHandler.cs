using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using AddressBook.Web.Domain;
using AddressBook.Web.Interfaces;
using MediatR;

namespace AddressBook.Web.Application;

internal class GetContactByIdQueryHandler(
  IRetrieve<int, Contact> retrieve) : IRequestHandler<GetContactByIdQuery, ContactModel?>
{
  public async Task<ContactModel?> Handle(GetContactByIdQuery request, CancellationToken cancellationToken)
  {
    var contact = await retrieve.TryRetrieveAsync(request.Id);
    return contact == null
      ? null
      : new ContactModel(contact.Id.Value, contact.FirstName, contact.LastName, contact.Birthday);
  }
}