using System.ComponentModel.DataAnnotations;

namespace AddressBook.Web.Models;

/// <summary>
/// Validates that a <see cref="DateTime"/> value is not later than today. A <c>null</c> value is valid.
/// It is a field-level attribute so that the message appears under the field it validates.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public sealed class NotInFutureAttribute : ValidationAttribute
{
    public NotInFutureAttribute() : base("{0} cannot be in the future")
    {
    }

    /// <inheritdoc />
    public override bool IsValid(object? value) =>
        value is null || (value is DateTime date && date.Date <= DateTime.Today);
}
