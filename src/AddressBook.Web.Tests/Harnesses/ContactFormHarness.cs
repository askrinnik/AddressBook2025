using AddressBook.Web.Models;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Wrapper for the contact form shared by <c>CreateContact</c> and <c>EditContact</c>: fill in fields,
/// submit/cancel, values and validation errors. Hides the MudBlazor markup (the testid sits directly on the
/// <c>input</c>; the birthday field is readonly, its value is set via <c>DateChanged</c> of <see cref="MudDatePicker"/>).
/// </summary>
public sealed class ContactFormHarness(IRenderedComponent<IComponent> cut)
{
    public string FirstName => cut.FindByTestId(TestIds.ContactFormFirstName).GetAttribute("value") ?? string.Empty;

    public string LastName => cut.FindByTestId(TestIds.ContactFormLastName).GetAttribute("value") ?? string.Empty;

    /// <summary>Texts of the field labels (<c>label.mud-input-label</c>) in render order.</summary>
    public IReadOnlyList<string> FieldLabels =>
        cut.FindAll("label.mud-input-label")
            .Select(e => e.TextContent.Trim())
            .Where(t => t.Length > 0)
            .ToList();

    public DateTime? Birthday => cut.FindComponent<MudDatePicker>().Instance.Date;

    public bool IsSubmitDisabled => cut.FindByTestId(TestIds.ContactFormSubmit).HasAttribute("disabled");

    public string SubmitText => cut.FindByTestId(TestIds.ContactFormSubmit).TextContent.Trim();

    /// <summary>
    /// All visible validation messages: MudBlazor field hints (<c>For=</c>) and <c>ValidationSummary</c>.
    /// </summary>
    public IReadOnlyList<string> ValidationMessages =>
        cut.FindAll(".mud-input-helper-text.mud-input-error, .validation-errors li, .validation-message")
            .Select(e => e.TextContent.Trim())
            .Where(t => t.Length > 0)
            .Distinct()
            .ToList();

    public ContactFormHarness SetFirstName(string value)
    {
        cut.FindByTestId(TestIds.ContactFormFirstName).Change(value);
        return this;
    }

    public ContactFormHarness SetLastName(string value)
    {
        cut.FindByTestId(TestIds.ContactFormLastName).Change(value);
        return this;
    }

    /// <summary>The birthday field is readonly (no text input) - set the value via <see cref="MudDatePicker"/>.</summary>
    public ContactFormHarness SetBirthday(DateTime? value)
    {
        var picker = cut.FindComponent<MudDatePicker>();
        cut.InvokeAsync(() => picker.Instance.DateChanged.InvokeAsync(value)).GetAwaiter().GetResult();
        return this;
    }

    public ContactFormHarness Fill(CreateContactModel model) =>
        SetFirstName(model.FirstName).SetLastName(model.LastName).SetBirthday(model.Birthday);

    /// <summary>Click on the submit button ("Create"/"Save"); bUnit turns it into a form submit.</summary>
    public void Submit() => cut.FindByTestId(TestIds.ContactFormSubmit).Click();

    public void Cancel() => cut.FindByTestId(TestIds.ContactFormCancel).Click();
}
