using AddressBook.Contracts.Models;
using AddressBook.Web.Models;
using Bogus;

namespace AddressBook.Web.Tests.Data;

/// <summary>
/// Фабрики тестовых данных на Bogus — порт <c>src/UiTests/src/data/contact.factory.ts</c>.
/// <see cref="New"/> строит <see cref="CreateContactModel"/> (форма create/edit),
/// <see cref="Existing"/> — <see cref="ContactModel"/> (строка списка / ответ API).
/// Каждый вызов использует собственный <see cref="Faker"/> (он не потокобезопасен, а xUnit
/// гоняет тесты параллельно).
/// </summary>
public static class ContactBuilder
{
    /// <summary>Лимит длины имени/фамилии — <c>MaximumLength(30)</c> в валидаторах API.</summary>
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

    /// <summary>Дата в прошлом, гарантированно раньше сегодняшнего дня.</summary>
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

    /// <summary>Модели формы создания/редактирования.</summary>
    public static class New
    {
        public static CreateContactModel Valid() => Base();

        public static CreateContactModel WithoutBirthday() => Mutate(m => m.Birthday = null);

        public static CreateContactModel FirstName30Chars() => Mutate(m => m.FirstName = NameOfLength(MaxNameLength));

        public static CreateContactModel FirstName31Chars() => Mutate(m => m.FirstName = NameOfLength(MaxNameLength + 1));

        public static CreateContactModel LastName30Chars() => Mutate(m => m.LastName = NameOfLength(MaxNameLength));

        public static CreateContactModel LastName31Chars() => Mutate(m => m.LastName = NameOfLength(MaxNameLength + 1));

        public static CreateContactModel EmptyFirstName() => Mutate(m => m.FirstName = string.Empty);

        public static CreateContactModel EmptyLastName() => Mutate(m => m.LastName = string.Empty);

        /// <summary>Три пробела: не пустая строка, но по смыслу пустое имя.</summary>
        public static CreateContactModel WhitespaceFirstName() => Mutate(m => m.FirstName = "   ");

        public static CreateContactModel WhitespaceLastName() => Mutate(m => m.LastName = "   ");

        public static CreateContactModel BirthdayInFuture() => Mutate(m => m.Birthday = DateTime.Today.AddDays(1));

        public static CreateContactModel BirthdayToday() => Mutate(m => m.Birthday = DateTime.Today);
    }

    /// <summary>Существующие контакты (<see cref="ContactModel"/>); <c>id</c> по умолчанию уникален.</summary>
    public static class Existing
    {
        public static ContactModel Valid(int? id = null) => ToExisting(New.Valid(), id);

        public static ContactModel WithoutBirthday(int? id = null) => ToExisting(New.WithoutBirthday(), id);

        public static ContactModel FirstName30Chars(int? id = null) => ToExisting(New.FirstName30Chars(), id);

        public static ContactModel FirstName31Chars(int? id = null) => ToExisting(New.FirstName31Chars(), id);

        public static ContactModel LastName30Chars(int? id = null) => ToExisting(New.LastName30Chars(), id);

        public static ContactModel LastName31Chars(int? id = null) => ToExisting(New.LastName31Chars(), id);

        public static ContactModel EmptyFirstName(int? id = null) => ToExisting(New.EmptyFirstName(), id);

        public static ContactModel EmptyLastName(int? id = null) => ToExisting(New.EmptyLastName(), id);

        public static ContactModel WhitespaceFirstName(int? id = null) => ToExisting(New.WhitespaceFirstName(), id);

        public static ContactModel WhitespaceLastName(int? id = null) => ToExisting(New.WhitespaceLastName(), id);

        public static ContactModel BirthdayInFuture(int? id = null) => ToExisting(New.BirthdayInFuture(), id);

        public static ContactModel BirthdayToday(int? id = null) => ToExisting(New.BirthdayToday(), id);

        /// <summary>Список валидных контактов с уникальными id.</summary>
        public static IReadOnlyList<ContactModel> List(int count) =>
            Enumerable.Range(0, count).Select(_ => Valid()).ToList();
    }
}
