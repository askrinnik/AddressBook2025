using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using AddressBook.Web.Domain;
using AddressBook.Web.Interfaces;
using MediatR;

namespace AddressBook.Web.Application;

public class GetFilteredContactsQueryHandler(
  IRetrieveMany<GetFilteredContactsQuery, Contact> contactsRetriever
    ) : IRequestHandler<GetFilteredContactsQuery, GetFilteredContactsResponse>
{
  public async Task<GetFilteredContactsResponse> Handle(GetFilteredContactsQuery request, CancellationToken cancellationToken)
  {
    var contacts = await contactsRetriever.RetrieveManyAsync(request);
    var contactModels = contacts.Select(c => new ContactModel(c.Id, c.FirstName, c.LastName, c.Birthday)).ToArray();
    return new(contactModels.Length, contactModels);
  }
}