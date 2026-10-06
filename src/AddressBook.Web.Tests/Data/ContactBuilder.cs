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
    /// <summary>Max length of first/last name - <c>MaximumLength(30)</c> in the API validators.</summary>
    public const int MaxNameLength = 30;

    private static int _nextId;

    private static int NextId() => Interlocked.Increment(ref _nextId);

    private static string Name(Func<Faker, string> pick)
    {
        var name = pick(new Faker());
        return name.Length > MaxNameLength ? name[..MaxNameLength] : name;
    }

    private static string NameOfLength(int length) =>
        new Faker().Random.String2(length, "abcdefghijklmnopqrstuvwxyz");

    /// <summary>A date in the past, guaranteed to be earlier than today.</summary>
    private static DateTime PastBirthday() =>
        new Faker().Date.Past(60, DateTime.Today.AddDays(-1)).Date;

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

        public static CreateContactModel FirstName30Chars() => Mutate(m => m.FirstName = NameOfLength(MaxNameLength));

        public static CreateContactModel FirstName31Chars() => Mutate(m => m.FirstName = NameOfLength(MaxNameLength + 1));

        public static CreateContactModel LastName30Chars() => Mutate(m => m.LastName = NameOfLength(MaxNameLength));

        public static CreateContactModel LastName31Chars() => Mutate(m => m.LastName = NameOfLength(MaxNameLength + 1));

        /// <summary>Three spaces: not an empty string, but semantically an empty name.</summary>
        public static CreateContactModel WhitespaceFirstName() => Mutate(m => m.FirstName = "   ");

        public static CreateContactModel WhitespaceLastName() => Mutate(m => m.LastName = "   ");

        public static CreateContactModel BirthdayInFuture() => Mutate(m => m.Birthday = DateTime.Today.AddDays(1));

        public static CreateContactModel BirthdayToday() => Mutate(m => m.Birthday = DateTime.Today);
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
