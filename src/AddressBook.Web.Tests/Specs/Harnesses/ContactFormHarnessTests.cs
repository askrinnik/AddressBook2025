using AddressBook.Web.Models;
using AddressBook.Web.Pages;

namespace AddressBook.Web.Tests.Specs.Harnesses;

public class ContactFormHarnessTests : MudTestContext
{
    private (IRenderedComponent<CreateContact> Cut, ContactFormHarness Form) RenderForm()
    {
        RenderProviders();
        var cut = Render<CreateContact>();
        return (cut, new ContactFormHarness(cut));
    }

    [Fact]
    public async Task Fill_SetsFieldValues()
    {
        var (_, form) = RenderForm();
        var model = ContactBuilder.New.Valid();

        await form.FillAsync(model);

        Assert.Equal(model.FirstName, form.FirstName);
        Assert.Equal(model.LastName, form.LastName);
        Assert.Equal(model.Birthday, form.Birthday);
    }

    [Fact]
    public async Task Submit_ValidForm_CallsServiceWithValuesAndNavigatesToContacts()
    {
        var (_, form) = RenderForm();
        var model = ContactBuilder.New.Valid();

        await form.FillAsync(model);
        form.Submit();

        await ApiService.Received(1).CreateContact(Arg.Is<CreateContactModel>(m =>
            m.FirstName == model.FirstName && m.LastName == model.LastName && m.Birthday == model.Birthday));
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Submit_EmptyNames_BlocksSubmitAndShowsValidationMessages()
    {
        var (_, form) = RenderForm();

        form.Submit();

        ApiService.DidNotReceiveCreate();
        Assert.NotEmpty(form.ValidationMessages);
    }

    [Fact]
    public void Cancel_NavigatesToContactsWithoutCallingService()
    {
        var (_, form) = RenderForm();

        form.Cancel();

        ApiService.DidNotReceiveCreate();
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void SubmitButton_IsEnabledAndLabelledCreate()
    {
        var (_, form) = RenderForm();

        Assert.False(form.IsSubmitDisabled);
        Assert.Equal("Create", form.SubmitText);
    }
}
