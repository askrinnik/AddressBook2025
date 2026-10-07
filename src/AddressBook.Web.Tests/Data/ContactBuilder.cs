using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using AddressBook.Web.Models;
using Bogus;

namespace AddressBook.Web.Tests.Data;

/// <summary>
/// Test data factories on Bogus - a port of <c>src/UiTests/src/data/contact.factory.ts</c>.
/// <see cref="New"/> builds a <see cref="CreateContactModel"/> (create/edit form),
/// <see cref="Existing"/> builds a <see cref="ContactModel"/> (list row / API response).
/// Each call uses its own <see cref="Faker"/> (it is not thread-safe, and xUnit
/// runs tests in parallel).
/// </summary>
public static class ContactBuilder
{
    private static int _nextId;

    private static int NextId() => Interlocked.Increment(ref _nextId);

    private static string Name(Func<Faker, string> pick)
    {
        var name = pick(new Faker());
        return name.Length > ContactRules.NameMaxLength ? name[..ContactRules.NameMaxLength] : name;
    }

    private static string NameOfLength(int length) =>
        new Faker().Random.String2(length, "abcdefghijklmnopqrstuvwxyz");

    /// <summary>
    /// The current UTC date as a <see cref="DateTime"/> at midnight - the "today" of the birthday rule on both
    /// the client and the API, so the boundary data does not depend on the machine's time zone.
    /// </summary>
    private static DateTime TodayUtc() =>
        ContactRules.TodayUtc(TimeProvider.System).ToDateTime(TimeOnly.MinValue);

    /// <summary>A date in the past, guaranteed to be earlier than today (UTC).</summary>
    private static DateTime PastBirthday() =>
        new Faker().Date.Past(60, TodayUtc().AddDays(-1)).Date;

    private static CreateContactModel Base() => new()
    {
        FirstName = Name(f => f.Name.FirstName()),
        LastName = Name(f => f.Name.LastName()),
        Birthday = PastBirthday(),
    };

    private static CreateContactModel Mutate(Action<CreateContactModel> change)
    {
        var model = Base();
        change(model);
        return model;
    }

    private static ContactModel ToExisting(CreateContactModel m, int? id) =>
        new(id ?? NextId(), m.FirstName, m.LastName, m.Birthday is { } d ? DateOnly.FromDateTime(d) : null);

    /// <summary>Create/edit form models.</summary>
    public static class New
    {
        public static CreateContactModel Valid() => Base();

        public static CreateContactModel WithoutBirthday() => Mutate(m => m.Birthday = null);

        public static CreateContactModel FirstName30Chars() => Mutate(m => m.FirstName = NameOfLength(ContactRules.NameMaxLength));

        public static CreateContactModel FirstName31Chars() => Mutate(m => m.FirstName = NameOfLength(ContactRules.NameMaxLength + 1));

        public static CreateContactModel LastName30Chars() => Mutate(m => m.LastName = NameOfLength(ContactRules.NameMaxLength));

        public static CreateContactModel LastName31Chars() => Mutate(m => m.LastName = NameOfLength(ContactRules.NameMaxLength + 1));

        /// <summary>Three spaces: not an empty string, but semantically an empty name.</summary>
        public static CreateContactModel WhitespaceFirstName() => Mutate(m => m.FirstName = "   ");

        public static CreateContactModel WhitespaceLastName() => Mutate(m => m.LastName = "   ");

        /// <summary>Birthday on the next UTC day - the first date the birthday rule rejects.</summary>
        public static CreateContactModel BirthdayInFuture() => Mutate(m => m.Birthday = TodayUtc().AddDays(1));

        /// <summary>Birthday on the current UTC day - the last date the birthday rule accepts.</summary>
        public static CreateContactModel BirthdayToday() => Mutate(m => m.Birthday = TodayUtc());

        /// <summary>A valid contact with the given birthday - for tests that pin the clock to a fixed date.</summary>
        public static CreateContactModel WithBirthday(DateTime birthday) => Mutate(m => m.Birthday = birthday);
    }

    /// <summary>Existing contacts (<see cref="ContactModel"/>); <c>id</c> is unique by default.</summary>
    public static class Existing
    {
        public static ContactModel Valid(int? id = null) => ToExisting(New.Valid(), id);

        public static ContactModel WithoutBirthday(int? id = null) => ToExisting(New.WithoutBirthday(), id);

        public static ContactModel FirstName31Chars(int? id = null) => ToExisting(New.FirstName31Chars(), id);

        public static ContactModel BirthdayInFuture(int? id = null) => ToExisting(New.BirthdayInFuture(), id);

        /// <summary>A list of valid contacts with unique ids.</summary>
        public static IReadOnlyList<ContactModel> List(int count) =>
            Enumerable.Range(0, count).Select(_ => Valid()).ToList();
    }
}
