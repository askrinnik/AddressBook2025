using AddressBook.Contracts.Models;
using AddressBook.Web.Models;

namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// NSubstitute helpers for <see cref="IAddressBookApiService"/>: common <c>Returns</c> setups
/// and <c>Received</c>/<c>DidNotReceive</c> checks, so tests read in domain terms.
/// </summary>
public static class ApiServiceMock
{
    // --- Response setup ---

    /// <summary>Any list request (any term) returns the given contacts; TotalRows = their count.</summary>
    public static IAddressBookApiService ReturnsContacts(this IAddressBookApiService service, params ContactModel[] contacts) =>
        service.ReturnsContacts(contacts, contacts.Length);

    public static IAddressBookApiService ReturnsContacts(
        this IAddressBookApiService service, IReadOnlyCollection<ContactModel> contacts, int totalRows)
    {
        service.GetFilteredContactsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new GetFilteredContactsResponse(totalRows, contacts));
        return service;
    }

    /// <summary>Responds only to a specific search term (overrides the generic <c>ReturnsContacts</c>).</summary>
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

    /// <summary>Contact not found: the service returns <c>null</c> (same as after a 404).</summary>
    public static IAddressBookApiService ReturnsContactNotFound(this IAddressBookApiService service, int id)
    {
        service.GetContactByIdAsync(id, Arg.Any<CancellationToken>()).Returns((ContactModel?)null);
        return service;
    }

    public static IAddressBookApiService ThrowsOnGetContact(this IAddressBookApiService service, int id, Exception exception)
    {
        service.GetContactByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromException<ContactModel?>(exception));
        return service;
    }

    /// <summary>The contact request stays pending until the returned source is completed.</summary>
    public static TaskCompletionSource<ContactModel?> HoldsContactRequest(this IAddressBookApiService service, int id)
    {
        var pending = new TaskCompletionSource<ContactModel?>();
        service.GetContactByIdAsync(id, Arg.Any<CancellationToken>()).Returns(pending.Task);
        return pending;
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

    public static IAddressBookApiService ThrowsOnCreate(this IAddressBookApiService service, Exception exception)
    {
        service.CreateContact(Arg.Any<CreateContactModel>()).Returns(_ => Task.FromException<int>(exception));
        return service;
    }

    public static IAddressBookApiService ThrowsOnDelete(this IAddressBookApiService service, Exception exception)
    {
        service.DeleteContact(Arg.Any<int>()).Returns(_ => Task.FromException(exception));
        return service;
    }

    // --- Call verification ---

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
