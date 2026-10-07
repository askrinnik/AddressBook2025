using System.ComponentModel.DataAnnotations;
using AddressBook.Contracts;

namespace AddressBook.Web.Models;

/// <summary>
/// Validates that a birthday is not later than the current UTC date, the same rule the API applies
/// (<see cref="ContactRules.IsBirthdayNotInFuture"/>). A <c>null</c> value is valid.
/// It is a field-level attribute so that the message appears under the field it validates.
/// </summary>
/// <remarks>
/// The clock is the <see cref="TimeProvider"/> registered in DI: <c>DataAnnotationsValidator</c> passes the
/// service provider into the <see cref="ValidationContext"/>. Without a service provider the attribute
/// falls back to <see cref="TimeProvider.System"/>.
/// </remarks>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public sealed class NotInFutureAttribute : ValidationAttribute
{
    /// <summary>
    /// Creates the attribute with the birthday message shared with the API.
    /// </summary>
    public NotInFutureAttribute() : base(ContactRules.BirthdayInFutureMessage)
    {
    }

    /// <inheritdoc />
    protected override ValidationResult? IsValid(object? value, ValidationContext? validationContext)
    {
        var timeProvider = validationContext?.GetService(typeof(TimeProvider)) as TimeProvider ?? TimeProvider.System;
        DateOnly? birthday = value is DateTime date ? DateOnly.FromDateTime(date) : null;

        if (ContactRules.IsBirthdayNotInFuture(birthday, timeProvider))
            return ValidationResult.Success;

        string[]? memberNames = validationContext?.MemberName is { } memberName ? [memberName] : null;

        return new(FormatErrorMessage(validationContext?.DisplayName ?? string.Empty), memberNames);
    }
}
