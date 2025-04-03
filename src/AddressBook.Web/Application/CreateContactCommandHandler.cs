using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using AddressBook.Web.Domain;
using AddressBook.Web.Interfaces;
using MediatR;

namespace AddressBook.Web.Application;

internal class CreateContactCommandHandler(
  ICreate<Contact> create) : IRequestHandler<CreateContactCommand, CreateContactCommandResponse>
{
  public async Task<CreateContactCommandResponse> Handle(CreateContactCommand request, CancellationToken cancellationToken)
  {
    var contact = new Contact()
    {
      FirstName = request.FirstName,
      LastName = request.LastName,
      Birthday = request.Birthday,
      OwnerId = OwnerId.Default()
    };
    var createdContact = await create.CreateAsync(contact);
    return new(createdContact.Id.Value);
  }
}