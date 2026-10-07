using AddressBook.Contracts;
using AddressBook.Web.Models;
using Microsoft.AspNetCore.Components;
using AddressBook.Web.Pages;

namespace AddressBook.Web.Tests.Specs.Pages;

public class CreateContactTests : MudTestContext
{
    private const string InitialPath = "/create-contact";
    private const string FirstNameRequired = "The First name field is required.";
    private const string LastNameRequired = "The Last name field is required.";

    private static readonly string FirstNameTooLong = $"The field First name must be a string with a maximum length of {ContactRules.NameMaxLength}.";
    private static readonly string LastNameTooLong = $"The field Last name must be a string with a maximum length of {ContactRules.NameMaxLength}.";
    private const string BirthdayInFutureMessage = ContactRules.BirthdayInFutureMessage;

    private ContactFormHarness RenderForm()
    {
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo(InitialPath);
        return new ContactFormHarness(Render<CreateContact>());
    }

    [Fact]
    public void Submit_EmptyNames_BlocksSubmit_AndShowsRequiredMessagesForBothFields()
    {
        var form = RenderForm();

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Equal(InitialPath, CurrentPath);
        Assert.Contains(FirstNameRequired, form.ValidationMessages);
        Assert.Contains(LastNameRequired, form.ValidationMessages);
    }

    [Fact]
    public void Render_ShowsSentenceCaseFieldLabels()
    {
        var form = RenderForm();

        Assert.Contains("First name", form.FieldLabels);
        Assert.Contains("Last name", form.FieldLabels);
    }

    [Fact]
    public void Render_SubmitButton_IsEnabledAndLabelledCreate()
    {
        var form = RenderForm();

        Assert.False(form.IsSubmitDisabled);
        Assert.Equal("Create", form.SubmitText);
    }

    [Fact]
    public void Submit_OnlyFirstNameEmpty_BlocksSubmit_AndShowsOnlyFirstNameMessage()
    {
        var form = RenderForm();
        form.SetLastName(ContactBuilder.New.Valid().LastName);

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Contains(FirstNameRequired, form.ValidationMessages);
        Assert.DoesNotContain(LastNameRequired, form.ValidationMessages);
    }

    [Fact]
    public void Submit_OnlyLastNameEmpty_BlocksSubmit_AndShowsOnlyLastNameMessage()
    {
        var form = RenderForm();
        form.SetFirstName(ContactBuilder.New.Valid().FirstName);

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Contains(LastNameRequired, form.ValidationMessages);
        Assert.DoesNotContain(FirstNameRequired, form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_ValidForm_CreatesContact_AndNavigatesToContacts()
    {
        var form = RenderForm();
        var model = ContactBuilder.New.Valid();
        ApiService.ReturnsCreatedId(1);
        await form.FillAsync(model);

        form.Submit();

        await ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m =>
            m.FirstName == model.FirstName && m.LastName == model.LastName && m.Birthday == model.Birthday));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_WithoutBirthday_CreatesContact_AndNavigatesToContacts()
    {
        var form = RenderForm();
        var model = ContactBuilder.New.WithoutBirthday();
        ApiService.ReturnsCreatedId(1);
        await form.FillAsync(model);

        form.Submit();

        await ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m =>
            m.FirstName == model.FirstName && m.LastName == model.LastName && m.Birthday == null));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_FirstName30Chars_CreatesContact()
    {
        var form = RenderForm();
        var model = ContactBuilder.New.FirstName30Chars();
        ApiService.ReturnsCreatedId(1);
        await form.FillAsync(model);

        form.Submit();

        await ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m => m.FirstName == model.FirstName));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_LastName30Chars_CreatesContact()
    {
        var form = RenderForm();
        var model = ContactBuilder.New.LastName30Chars();
        ApiService.ReturnsCreatedId(1);
        await form.FillAsync(model);

        form.Submit();

        await ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m => m.LastName == model.LastName));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_FirstName31Chars_BlocksSubmit_AndShowsLengthMessage()
    {
        var form = RenderForm();
        await form.FillAsync(ContactBuilder.New.FirstName31Chars());

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Equal(InitialPath, CurrentPath);
        Assert.Contains(FirstNameTooLong, form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_LastName31Chars_BlocksSubmit_AndShowsLengthMessage()
    {
        var form = RenderForm();
        await form.FillAsync(ContactBuilder.New.LastName31Chars());

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Equal(InitialPath, CurrentPath);
        Assert.Contains(LastNameTooLong, form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_WhitespaceFirstName_BlocksSubmit_AndShowsRequiredMessage()
    {
        var form = RenderForm();
        await form.FillAsync(ContactBuilder.New.WhitespaceFirstName());

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Contains(FirstNameRequired, form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_WhitespaceLastName_BlocksSubmit_AndShowsRequiredMessage()
    {
        var form = RenderForm();
        await form.FillAsync(ContactBuilder.New.WhitespaceLastName());

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Contains(LastNameRequired, form.ValidationMessages);
    }

    [Fact]
    public async Task Submit_BirthdayToday_CreatesContact()
    {
        var form = RenderForm();
        var model = ContactBuilder.New.BirthdayToday();
        ApiService.ReturnsCreatedId(1);
        await form.FillAsync(model);

        form.Submit();

        await ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m => m.Birthday == model.Birthday));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_BirthdayInFuture_BlocksSubmit_AndShowsBirthdayMessage()
    {
        var form = RenderForm();
        await form.FillAsync(ContactBuilder.New.BirthdayInFuture());

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Equal(InitialPath, CurrentPath);
        Assert.Contains(BirthdayInFutureMessage, form.ValidationMessages);
    }

    [Fact]
    public void Render_BirthdayPickerMaxDate_IsUtcToday()
    {
        UseClock(FixedTimeProvider.LocalDayAheadOfUtc());

        var form = RenderForm();

        Assert.Equal(FixedTimeProvider.LateUtcEveningUtcDate, form.BirthdayMaxDate);
    }

    [Fact]
    public async Task Submit_BirthdayUtcTomorrowButLocalToday_BlocksSubmit()
    {
        UseClock(FixedTimeProvider.LocalDayAheadOfUtc());
        var form = RenderForm();
        await form.FillAsync(ContactBuilder.New.WithBirthday(FixedTimeProvider.LateUtcEveningLocalDate));

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.Equal(InitialPath, CurrentPath);
        Assert.Contains(BirthdayInFutureMessage, form.ValidationMessages);
    }

    [Fact]
    public async Task Cancel_NavigatesToContacts_WithoutCreating()
    {
        var form = RenderForm();
        await form.FillAsync(ContactBuilder.New.Valid());

        form.Cancel();

        ApiService.DidNotReceiveCreate();
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_WhileCreateIsPending_DisablesSubmitButton_UntilItCompletes()
    {
        var form = RenderForm();
        var pending = new TaskCompletionSource<int>();
        ApiService.CreateContact(Arg.Any<CreateContactModel>()).Returns(pending.Task);
        await form.FillAsync(ContactBuilder.New.Valid());
        Assert.False(form.IsSubmitDisabled);

        form.Submit();

        Assert.True(form.IsSubmitDisabled);
        Assert.Equal(InitialPath, CurrentPath);

        pending.SetResult(1);

        form.WaitForNavigation("/contacts");
    }
}
