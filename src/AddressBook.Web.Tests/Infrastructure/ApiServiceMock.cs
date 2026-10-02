using AddressBook.Contracts.Models;
using AddressBook.Web.Models;

namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Хелперы NSubstitute для <see cref="IAddressBookApiService"/>: частые расстановки <c>Returns</c>
/// и проверки <c>Received</c>/<c>DidNotReceive</c>, чтобы тесты читались доменно.
/// </summary>
public static class ApiServiceMock
{
    // --- Настройка ответов ---

    /// <summary>Любой запрос списка (любой термин) возвращает переданные контакты; TotalRows = их количество.</summary>
    public static IAddressBookApiService ReturnsContacts(this IAddressBookApiService service, params ContactModel[] contacts) =>
        service.ReturnsContacts(contacts, contacts.Length);

    public static IAddressBookApiService ReturnsContacts(
        this IAddressBookApiService service, IReadOnlyCollection<ContactModel> contacts, int totalRows)
    {
        service.GetFilteredContactsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new GetFilteredContactsResponse(totalRows, contacts));
        return service;
    }

    /// <summary>Ответ только на конкретный поисковый термин (перекрывает общий <c>ReturnsContacts</c>).</summary>
    public static IAddressBookApiService ReturnsContactsFor(
        this IAddressBookApiService service, string searchTerm, params ContactModel[] contacts)
    {
        service.GetFilteredContactsAsync(searchTerm, Arg.Any<CancellationToken>())
            .Returns(new GetFilteredContactsResponse(contacts.Length, contacts));
        return service;
    }

    public static IAddressBookApiService ReturnsContact(this IAddressBookApiService service, ContactModel contact)
    {
        service.GetContactByIdAsync(contact.Id, Arg.Any<CancellationToken>()).Returns(contact);
        return service;
    }

    /// <summary>Контакт не найден: сервис возвращает <c>null</c> (так же, как после 404).</summary>
    public static IAddressBookApiService ReturnsContactNotFound(this IAddressBookApiService service, int id)
    {
        service.GetContactByIdAsync(id, Arg.Any<CancellationToken>()).Returns((ContactModel?)null);
        return service;
    }

    public static IAddressBookApiService ReturnsCreatedId(this IAddressBookApiService service, int id)
    {
        service.CreateContact(Arg.Any<CreateContactModel>()).Returns(id);
        return service;
    }

    public static IAddressBookApiService ThrowsOnGetContacts(this IAddressBookApiService service, Exception exception)
    {
        service.GetFilteredContactsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns<GetFilteredContactsResponse?>(_ => throw exception);
        return service;
    }

    public static IAddressBookApiService ThrowsOnDelete(this IAddressBookApiService service, Exception exception)
    {
        service.DeleteContact(Arg.Any<int>()).Returns(_ => Task.FromException(exception));
        return service;
    }

    // --- Проверки вызовов ---

    public static void ReceivedSearch(this IAddressBookApiService service, string searchTerm, int times = 1) =>
        service.Received(times).GetFilteredContactsAsync(searchTerm, Arg.Any<CancellationToken>());

    public static void DidNotReceiveSearch(this IAddressBookApiService service) =>
        service.DidNotReceive().GetFilteredContactsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());

    public static void ReceivedDelete(this IAddressBookApiService service, int id, int times = 1) =>
        service.Received(times).DeleteContact(id);

    public static void DidNotReceiveDelete(this IAddressBookApiService service) =>
        service.DidNotReceive().DeleteContact(Arg.Any<int>());

    public static void ReceivedCreate(this IAddressBookApiService service, int times = 1) =>
        service.Received(times).CreateContact(Arg.Any<CreateContactModel>());

    public static void DidNotReceiveCreate(this IAddressBookApiService service) =>
        service.DidNotReceive().CreateContact(Arg.Any<CreateContactModel>());

    public static void ReceivedUpdate(this IAddressBookApiService service, int id, int times = 1) =>
        service.Received(times).UpdateContact(id, Arg.Any<CreateContactModel>(), Arg.Any<CancellationToken>());

    public static void DidNotReceiveUpdate(this IAddressBookApiService service) =>
        service.DidNotReceive().UpdateContact(Arg.Any<int>(), Arg.Any<CreateContactModel>(), Arg.Any<CancellationToken>());
}
