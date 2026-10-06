using AddressBook.Contracts.Models;
using AddressBook.Web.Models;
using NSubstitute.Exceptions;

namespace AddressBook.Web.Tests.Specs.Infrastructure;

public class ApiServiceMockTests
{
    private static readonly ContactModel Ann = new(1, "Ann", "Lee", null);
    private static readonly ContactModel Bob = new(2, "Bob", "Ray", new DateOnly(1990, 1, 2));

    private readonly IAddressBookApiService _service = Substitute.For<IAddressBookApiService>();
    private static CancellationToken Ct => Xunit.TestContext.Current.CancellationToken;

    [Fact]
    public async Task ReturnsContacts_ReturnsRowsAndTotal_ForAnyTerm()
    {
        _service.ReturnsContacts(Ann, Bob);

        var response = await _service.GetFilteredContactsAsync("anything", Ct);

        Assert.Equal(2, response!.TotalRows);
        Assert.Equal([Ann, Bob], response.Rows);
    }

    [Fact]
    public async Task ReturnsContactsFor_OverridesGeneralSetup_ForThatTerm()
    {
        _service.ReturnsContacts(Ann, Bob).ReturnsContactsFor("bob", Bob);

        var filtered = await _service.GetFilteredContactsAsync("bob", Ct);
        var all = await _service.GetFilteredContactsAsync("", Ct);

        Assert.Equal([Bob], filtered!.Rows);
        Assert.Equal(2, all!.Rows.Count);
    }

    [Fact]
    public async Task ReturnsContact_AndNotFound()
    {
        _service.ReturnsContact(Ann).ReturnsContactNotFound(99);

        Assert.Equal(Ann, await _service.GetContactByIdAsync(1, Ct));
        Assert.Null(await _service.GetContactByIdAsync(99, Ct));
    }

    [Fact]
    public async Task ReturnsCreatedId_ReturnsId()
    {
        _service.ReturnsCreatedId(17);

        Assert.Equal(17, await _service.CreateContact(new CreateContactModel()));
    }

    [Fact]
    public async Task ThrowsOnGetContacts_OnDelete_AndOnCreate_Throw()
    {
        _service.ThrowsOnGetContacts(new InvalidOperationException("boom"))
            .ThrowsOnDelete(new HttpRequestException("nope"))
            .ThrowsOnCreate(new TimeoutException("slow"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.GetFilteredContactsAsync("x", Ct));
        await Assert.ThrowsAsync<HttpRequestException>(() => _service.DeleteContact(1));
        await Assert.ThrowsAsync<TimeoutException>(() => _service.CreateContact(new CreateContactModel()));
    }

    [Fact]
    public async Task ReceivedHelpers_PassWhenCalled_AndFailWhenNot()
    {
        _service.ReturnsContacts(Ann);

        await _service.GetFilteredContactsAsync("a", Ct);
        await _service.DeleteContact(3);
        await _service.CreateContact(new CreateContactModel());
        await _service.UpdateContact(4, new CreateContactModel(), Ct);

        _service.ReceivedSearch("a");
        _service.ReceivedDelete(3);
        _service.ReceivedCreate();
        _service.ReceivedUpdate(4);
        Assert.Throws<ReceivedCallsException>(() => _service.ReceivedDelete(99));
        Assert.Throws<ReceivedCallsException>(() => _service.DidNotReceiveDelete());
    }

    [Fact]
    public void DidNotReceiveHelpers_PassWhenNothingCalled()
    {
        _service.DidNotReceiveSearch();
        _service.DidNotReceiveDelete();
        _service.DidNotReceiveCreate();
        _service.DidNotReceiveUpdate();
    }
}
