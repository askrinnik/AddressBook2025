using AddressBook.Web.Models;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Обёртка формы контакта, общей для <c>CreateContact</c> и <c>EditContact</c>: заполнить поля,
/// сабмит/отмена, значения и ошибки валидации. Скрывает MudBlazor-разметку (testid лежит прямо на
/// <c>input</c>; поле birthday — readonly, значение задаётся через <c>DateChanged</c> компонента <see cref="MudDatePicker"/>).
/// </summary>
public sealed class ContactFormHarness(IRenderedComponent<IComponent> cut)
{
    public string FirstName => cut.FindByTestId(TestIds.ContactFormFirstName).GetAttribute("value") ?? string.Empty;

    public string LastName => cut.FindByTestId(TestIds.ContactFormLastName).GetAttribute("value") ?? string.Empty;

    public DateTime? Birthday => cut.FindComponent<MudDatePicker>().Instance.Date;

    public bool IsSubmitDisabled => cut.FindByTestId(TestIds.ContactFormSubmit).HasAttribute("disabled");

    public string SubmitText => cut.FindByTestId(TestIds.ContactFormSubmit).TextContent.Trim();

    /// <summary>
    /// Все видимые сообщения валидации: подсказки полей MudBlazor (<c>For=</c>) и <c>ValidationSummary</c>.
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

    /// <summary>Поле birthday readonly (ввод текстом невозможен) — задаём значение через <see cref="MudDatePicker"/>.</summary>
    public ContactFormHarness SetBirthday(DateTime? value)
    {
        var picker = cut.FindComponent<MudDatePicker>();
        cut.InvokeAsync(() => picker.Instance.DateChanged.InvokeAsync(value)).GetAwaiter().GetResult();
        return this;
    }

    public ContactFormHarness Fill(CreateContactModel model) =>
        SetFirstName(model.FirstName).SetLastName(model.LastName).SetBirthday(model.Birthday);

    /// <summary>Клик по submit-кнопке («Create»/«Save»); bUnit превращает его в submit формы.</summary>
    public void Submit() => cut.FindByTestId(TestIds.ContactFormSubmit).Click();

    public void Cancel() => cut.FindByTestId(TestIds.ContactFormCancel).Click();
}
