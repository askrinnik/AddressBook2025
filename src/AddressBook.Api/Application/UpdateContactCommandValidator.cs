using AddressBook.Contracts;
using FluentValidation;

namespace AddressBook.Api.Application;

/// <summary>
/// Validates <see cref="UpdateContactCommand"/> with the limits and the birthday rule shared through <see cref="ContactRules"/>.
/// The clock comes from DI so the birthday is checked against the UTC date at validation time.
/// </summary>
internal sealed class UpdateContactCommandValidator : AbstractValidator<UpdateContactCommand>
{
  public UpdateContactCommandValidator(TimeProvider timeProvider)
  {
    RuleFor(x => x.FirstName)
      .NotEmpty()
      .MaximumLength(ContactRules.NameMaxLength);
    RuleFor(x => x.LastName)
      .NotEmpty()
      .MaximumLength(ContactRules.NameMaxLength);
    RuleFor(x => x.Birthday)
      .Must(birthday => ContactRules.IsBirthdayNotInFuture(birthday, timeProvider))
      .WithMessage(ContactRules.BirthdayInFutureMessage);
  }
}
