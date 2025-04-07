using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using MediatR;

namespace AddressBook.Api.Application;

internal class GetFilteredContactsQueryHandler(
  IRetrieveMany<GetFilteredContactsQuery, Contact> contactsRetriever
    ) : IRequestHandler<GetFilteredContactsQuery, GetFilteredContactsResponse>
{
  public async Task<GetFilteredContactsResponse> Handle(GetFilteredContactsQuery request, CancellationToken cancellationToken)
  {
    var contacts = await contactsRetriever.RetrieveManyAsync(request);
    var contactModels = contacts.Select(c => new ContactModel(c.Id.Value, c.FirstName, c.LastName, c.Birthday)).ToArray();
    return new(contactModels.Length, contactModels);
  }
}