using System.ComponentModel.DataAnnotations;
using AddressBook.Contracts;
using AddressBook.Web.Models;

namespace AddressBook.Web.Tests.Specs.Models;

/// <summary>
/// The birthday rule of <see cref="CreateContactModel.Birthday"/> (<see cref="NotInFutureAttribute"/>), validated the way
/// <c>DataAnnotationsValidator</c> does it: through <see cref="Validator"/> with the DI container in the
/// <see cref="ValidationContext"/>.
/// </summary>
public class NotInFutureAttributeTests
{
    private static List<ValidationResult> ValidateBirthday(DateTime? birthday, TimeProvider clock)
    {
        using var services = new ServiceCollection().AddSingleton(clock).BuildServiceProvider();
        var model = ContactBuilder.New.WithoutBirthday();
        var context = new ValidationContext(model, services, items: null) { MemberName = nameof(CreateContactModel.Birthday) };
        var results = new List<ValidationResult>();

        Validator.TryValidateProperty(birthday, context, results);

        return results;
    }

    [Fact]
    public void Validate_NullBirthday_IsValid() =>
        Assert.Empty(ValidateBirthday(null, FixedTimeProvider.LocalDayAheadOfUtc()));

    [Fact]
    public void Validate_UtcToday_IsValid() =>
        Assert.Empty(ValidateBirthday(FixedTimeProvider.LateUtcEveningUtcDate, new FixedTimeProvider(FixedTimeProvider.LateUtcEvening)));

    [Fact]
    public void Validate_UtcTomorrow_IsInvalid_WithSharedMessageOnBirthday()
    {
        var results = ValidateBirthday(FixedTimeProvider.LateUtcEveningUtcDate.AddDays(1),
            new FixedTimeProvider(FixedTimeProvider.LateUtcEvening));

        var result = Assert.Single(results);
        Assert.Equal(ContactRules.BirthdayInFutureMessage, result.ErrorMessage);
        Assert.Equal(nameof(CreateContactModel.Birthday), Assert.Single(result.MemberNames));
    }

    [Fact]
    public void Validate_LocalTodayAheadOfUtc_IsInvalid()
    {
        var results = ValidateBirthday(FixedTimeProvider.LateUtcEveningLocalDate, FixedTimeProvider.LocalDayAheadOfUtc());

        Assert.Equal(ContactRules.BirthdayInFutureMessage, Assert.Single(results).ErrorMessage);
    }

    [Fact]
    public void Validate_UtcTodayWhileLocalDayIsAhead_IsValid() =>
        Assert.Empty(ValidateBirthday(FixedTimeProvider.LateUtcEveningUtcDate, FixedTimeProvider.LocalDayAheadOfUtc()));

    [Fact]
    public void IsValid_WithoutServiceProvider_UsesSystemClockInUtc()
    {
        var attribute = new NotInFutureAttribute();

        Assert.True(attribute.IsValid(ContactBuilder.New.BirthdayToday().Birthday));
        Assert.False(attribute.IsValid(ContactBuilder.New.BirthdayInFuture().Birthday));
    }
}
