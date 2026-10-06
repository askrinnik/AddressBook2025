using System.Net;
using System.Net.Http.Json;
using AddressBook.Contracts.Models;
using AddressBook.Web.ErrorHandling;
using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Specs.Pages;

public class EditContactServerErrorTests : MudTestContext
{
    private static string PathFor(int id) => $"/edit-contact/{id}";

    private ContactFormHarness RenderLoadedForm(ContactModel contact)
    {
        ApiService.ReturnsContact(contact);
        return RenderForm(contact.Id);
    }

    private ContactFormHarness RenderForm(int id)
    {
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo(PathFor(id));
        return new ContactFormHarness(Render<EditContact>(p => p.Add(x => x.Id, id)));
    }

    private static ProblemDetailsException ValidationProblem(string errorsJson) =>
        new(("{\"title\":\"One or more validation errors occurred.\",\"status\":400,\"errors\":{" + errorsJson + "}}").ToProblemDetails());

    [Fact]
    public void Submit_ServerReturnsFieldError_ShowsMessageOnThatField_AndStaysOnPage()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderLoadedForm(contact);
        ApiService.ThrowsOnUpdate(ValidationProblem("""
            "FirstName":["First name is already taken."]
            """));

        form.Submit();

        Assert.Contains("First name is already taken.", form.ValidationMessages);
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        ApiService.ReceivedUpdate(contact.Id);
    }

    [Fact]
    public void Submit_ServerReturnsErrorsForSeveralFields_ShowsMessageOnEachField()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderLoadedForm(contact);
        ApiService.ThrowsOnUpdate(ValidationProblem("""
            "FirstName":["First name is too long."],
            "LastName":["Last name is too long."]
            """));

        form.Submit();

        Assert.Contains("First name is too long.", form.ValidationMessages);
        Assert.Contains("Last name is too long.", form.ValidationMessages);
        Assert.Equal(PathFor(contact.Id), CurrentPath);
    }

    [Fact]
    public void Submit_ServerReturnsError_EnablesSubmitButtonAgain()
    {
        var form = RenderLoadedForm(ContactBuilder.Existing.Valid());
        ApiService.ThrowsOnUpdate(ValidationProblem("""
            "LastName":["Last name is too long."]
            """));

        form.Submit();

        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public void Submit_ProblemDetailsWithoutErrors_ShowsDetailAsGeneralError_AndStaysOnPage()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderLoadedForm(contact);
        ApiService.ThrowsOnUpdate(new ProblemDetailsException(
            """{"title":"Internal Server Error","status":500,"detail":"Database is unavailable."}""".ToProblemDetails()));

        form.Submit();

        Assert.Contains("Database is unavailable.", form.ValidationMessages);
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public void Submit_ProblemDetailsWithTitleOnly_ShowsTitleAsGeneralError()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderLoadedForm(contact);
        ApiService.ThrowsOnUpdate(new ProblemDetailsException(
            """{"title":"Bad Request","status":400}""".ToProblemDetails()));

        form.Submit();

        Assert.Contains("Bad Request", form.ValidationMessages);
        Assert.Equal(PathFor(contact.Id), CurrentPath);
    }

    [Fact]
    public void Submit_ProblemDetailsWithoutTitleOrDetail_ShowsFallbackGeneralError()
    {
        var form = RenderLoadedForm(ContactBuilder.Existing.Valid());
        ApiService.ThrowsOnUpdate(new ProblemDetailsException("""{"status":500}""".ToProblemDetails()));

        form.Submit();

        Assert.Equal(["The request failed."], form.ValidationMessages);
    }

    [Fact]
    public void Submit_ProblemDetailsWithoutBody_ShowsNoMessages_AndStaysOnPage()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderLoadedForm(contact);
        ApiService.ThrowsOnUpdate(new ProblemDetailsException(null));

        form.Submit();

        Assert.Empty(form.ValidationMessages);
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public void Submit_UnexpectedException_ShowsItsMessageAsGeneralError_AndStaysOnPage()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderLoadedForm(contact);
        ApiService.ThrowsOnUpdate(new HttpRequestException("Service unavailable"));

        form.Submit();

        Assert.Contains("Service unavailable", form.ValidationMessages);
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public void Submit_RetryAfterServerError_ClearsOldMessages_AndNavigates()
    {
        var contact = ContactBuilder.Existing.Valid();
        var form = RenderLoadedForm(contact);
        ApiService.ThrowsOnUpdate(ValidationProblem("""
            "FirstName":["First name is already taken."]
            """));
        form.Submit();
        Assert.NotEmpty(form.ValidationMessages);
        ApiService.CompletesUpdate();

        form.Submit();

        Assert.Empty(form.ValidationMessages);
        Assert.Equal("/contacts", CurrentPath);
        ApiService.ReceivedUpdate(contact.Id, times: 2);
    }

    [Fact]
    public void Submit_GatewayReturnsHtmlBody_ShowsStatusTitle_NotJsonParserError()
    {
        var contact = ContactBuilder.Existing.Valid();
        using var handler = new FakeHttpMessageHandler()
            .Enqueue(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = JsonContent.Create(contact) })
            .RespondBody(HttpStatusCode.BadGateway, "<html><body>502 Bad Gateway</body></html>", "text/html");
        Services.AddSingleton<IAddressBookApiService>(handler.CreateService());
        var form = RenderForm(contact.Id);

        form.Submit();

        Assert.Equal(["Bad Gateway"], form.ValidationMessages);
        Assert.Equal(PathFor(contact.Id), CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }
}
