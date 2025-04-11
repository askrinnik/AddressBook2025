using AddressBook.Contracts;
using FluentValidation;

namespace AddressBook.Api.Application;

internal sealed class CreateContactCommandValidator : AbstractValidator<CreateContactCommand>
{
  public CreateContactCommandValidator()
  {
    RuleFor(x => x.FirstName)
      .NotEmpty()
      .MaximumLength(30);
    RuleFor(x => x.LastName)
      .NotEmpty()
      .MaximumLength(30);
  }
}