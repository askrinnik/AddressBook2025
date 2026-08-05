using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using FluentValidation;
using MediatR;

namespace AddressBook.Api.Application;

internal class UpdateContactCommandHandler(
  IUpdate<ContactId, Contact> update,
  IValidator<UpdateContactCommand> validator
  ) : IRequestHandler<UpdateContactCommand, UpdateContactCommandResponse>
{
  public async Task<UpdateContactCommandResponse> Handle(UpdateContactCommand request, CancellationToken cancellationToken)
  {
    await validator.ValidateAndThrowAsync(request, cancellationToken);

    var contact = new Contact
    {
      FirstName = request.FirstName.Trim(),
      LastName = request.LastName.Trim(),
      Birthday = request.Birthday
    };
    var found = await update.UpdateAsync(new ContactId(request.Id), contact);
    return new(found);
  }
}
