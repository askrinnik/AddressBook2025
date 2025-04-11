using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using FluentValidation;
using MediatR;

namespace AddressBook.Api.Application;

internal class CreateContactCommandHandler(
  ICreate<Contact> create,
  IValidator<CreateContactCommand> validator
  ) : IRequestHandler<CreateContactCommand, CreateContactCommandResponse>
{
  public async Task<CreateContactCommandResponse> Handle(CreateContactCommand request, CancellationToken cancellationToken)
  {
    await validator.ValidateAndThrowAsync(request, cancellationToken);

    var contact = new Contact
    {
      FirstName = request.FirstName.Trim(),
      LastName = request.LastName.Trim(),
      Birthday = request.Birthday,
      OwnerId = OwnerId.Default()
    };
    var createdContact = await create.CreateAsync(contact);
    return new(createdContact.Id.Value);
  }
}