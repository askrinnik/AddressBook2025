using System.Net;
using System.Text.Json;
using System.Web;
using AddressBook.Contracts.Models;
using AddressBook.Web.ErrorHandling;

namespace AddressBook.Web.Tests.Tests.Services;

public class AddressBookApiServiceTests
{
    private static CancellationToken Ct => Xunit.TestContext.Current.CancellationToken;

    private static string IsoDate(DateTime date) => DateOnly.FromDateTime(date).ToString("yyyy-MM-dd");

    private static JsonElement ParseBody(RecordedRequest request) => JsonDocument.Parse(request.Body!).RootElement;

    private static Dictionary<string, string[]> FieldErrors(params string[] fields) =>
        fields.ToDictionary(field => field, _ => new[] { "Invalid" });

    public class GetFilteredContacts
    {
        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("\t")]
        public async Task BlankTerm_RequestsContactsWithoutQuery(string term)
        {
            var handler = new FakeHttpMessageHandler().RespondJson(HttpStatusCode.OK, new GetFilteredContactsResponse(0, []));

            await handler.CreateService().GetFilteredContactsAsync(term, Ct);

            var request = handler.LastRequest;
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal("/api/contacts", request.Uri!.PathAndQuery);
        }

        [Fact]
        public async Task PlainTerm_AddsSearchQuery()
        {
            var handler = new FakeHttpMessageHandler().RespondJson(HttpStatusCode.OK, new GetFilteredContactsResponse(0, []));

            await handler.CreateService().GetFilteredContactsAsync("ann", Ct);

            Assert.Equal("/api/contacts?search=ann", handler.LastRequest.Uri!.PathAndQuery);
        }

        [Theory]
        [InlineData("a&b")]
        [InlineData("a#b")]
        [InlineData("a+b")]
        [InlineData("100%")]
        [InlineData("a b")]
        [InlineData("Ann-Marie O'Neil")]
        public async Task TermWithReservedCharacters_IsEncodedAndRoundTrips(string term)
        {
            var handler = new FakeHttpMessageHandler().RespondJson(HttpStatusCode.OK, new GetFilteredContactsResponse(0, []));

            await handler.CreateService().GetFilteredContactsAsync(term, Ct);

            var query = HttpUtility.ParseQueryString(handler.LastRequest.Uri!.Query);
            Assert.Equal(["search"], query.AllKeys);
            Assert.Equal(term, query["search"]);
        }

        [Fact]
        public async Task Success_DeserializesRowsAndTotal()
        {
            var rows = ContactBuilder.Existing.List(3);
            var handler = new FakeHttpMessageHandler().RespondJson(HttpStatusCode.OK, new GetFilteredContactsResponse(42, rows));

            var response = await handler.CreateService().GetFilteredContactsAsync(string.Empty, Ct);

            Assert.NotNull(response);
            Assert.Equal(42, response.TotalRows);
            Assert.Equal(rows, response.Rows);
        }

        [Fact]
        public async Task NonSuccess_ThrowsProblemDetailsException()
        {
            var handler = new FakeHttpMessageHandler().RespondProblem(HttpStatusCode.InternalServerError, "Server error");

            var ex = await Assert.ThrowsAsync<ProblemDetailsException>(() => handler.CreateService().GetFilteredContactsAsync("ann", Ct));

            Assert.Equal(500, ex.ProblemDetails!.Status);
        }
    }

    public class CreateContact
    {
        [Fact]
        public async Task SendsPostWithNamesAndBirthdayAsDateOnly()
        {
            var model = ContactBuilder.New.Valid();
            var handler = new FakeHttpMessageHandler().RespondCreated("http://localhost:5000/api/contacts/1");

            await handler.CreateService().CreateContact(model);

            var request = handler.LastRequest;
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("/api/contacts", request.Uri!.PathAndQuery);
            var body = ParseBody(request);
            Assert.Equal(model.FirstName, body.GetProperty("firstName").GetString());
            Assert.Equal(model.LastName, body.GetProperty("lastName").GetString());
            Assert.Equal(IsoDate(model.Birthday!.Value), body.GetProperty("birthday").GetString());
        }

        [Fact]
        public async Task WithoutBirthday_SendsNullBirthday()
        {
            var handler = new FakeHttpMessageHandler().RespondCreated("http://localhost:5000/api/contacts/1");

            await handler.CreateService().CreateContact(ContactBuilder.New.WithoutBirthday());

            Assert.Equal(JsonValueKind.Null, ParseBody(handler.LastRequest).GetProperty("birthday").ValueKind);
        }

        [Fact]
        public async Task BirthdayWithTimePart_IsSentAsDateOnly()
        {
            var model = ContactBuilder.New.Valid();
            model.Birthday = new DateTime(1990, 5, 17, 23, 59, 59);
            var handler = new FakeHttpMessageHandler().RespondCreated("http://localhost:5000/api/contacts/1");

            await handler.CreateService().CreateContact(model);

            Assert.Equal("1990-05-17", ParseBody(handler.LastRequest).GetProperty("birthday").GetString());
        }

        [Fact]
        public async Task Created_ReturnsIdFromLocation()
        {
            var handler = new FakeHttpMessageHandler().RespondCreated("http://localhost:5000/api/contacts/42");

            var id = await handler.CreateService().CreateContact(ContactBuilder.New.Valid());

            Assert.Equal(42, id);
        }

        [Theory]
        [InlineData("http://localhost:5000/api/contacts/abc")]
        [InlineData("http://localhost:5000/api/contacts/42/")]
        [InlineData("http://localhost:5000/api/contacts/")]
        public async Task LocationWithoutNumericLastSegment_ReturnsZero(string location)
        {
            var handler = new FakeHttpMessageHandler().RespondCreated(location);

            var id = await handler.CreateService().CreateContact(ContactBuilder.New.Valid());

            Assert.Equal(0, id);
        }

        [Fact]
        public async Task SuccessWithoutLocation_ReturnsZero()
        {
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.Created);

            var id = await handler.CreateService().CreateContact(ContactBuilder.New.Valid());

            Assert.Equal(0, id);
        }

        [Fact]
        public async Task NonSuccessWithoutProblemDetailsHandler_ReturnsZero()
        {
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.BadRequest);
            var service = handler.CreateService(withProblemDetails: false);

            var id = await service.CreateContact(ContactBuilder.New.Valid());

            Assert.Equal(0, id);
        }

        [Fact]
        public async Task ValidationProblem_ThrowsProblemDetailsExceptionWithFieldErrors()
        {
            var handler = new FakeHttpMessageHandler()
                .RespondProblem(HttpStatusCode.BadRequest, "Validation failed", errors: FieldErrors("FirstName", "LastName"));

            var ex = await Assert.ThrowsAsync<ProblemDetailsException>(() => handler.CreateService().CreateContact(ContactBuilder.New.Valid()));

            Assert.Equal(400, ex.ProblemDetails!.Status);
            Assert.Equal(["FirstName", "LastName"], ex.ProblemDetails.GetErrors().Keys.Order());
        }
    }

    public class GetContactById
    {
        [Fact]
        public async Task Found_ReturnsContact()
        {
            var contact = ContactBuilder.Existing.Valid(5);
            var handler = new FakeHttpMessageHandler().RespondJson(HttpStatusCode.OK, contact);

            var result = await handler.CreateService().GetContactByIdAsync(5, Ct);

            Assert.Equal(contact, result);
            Assert.Equal(HttpMethod.Get, handler.LastRequest.Method);
            Assert.Equal("/api/contacts/5", handler.LastRequest.Uri!.PathAndQuery);
        }

        [Fact]
        public async Task FoundWithoutBirthday_ReturnsNullBirthday()
        {
            var handler = new FakeHttpMessageHandler().RespondJson(HttpStatusCode.OK, ContactBuilder.Existing.WithoutBirthday(6));

            var result = await handler.CreateService().GetContactByIdAsync(6, Ct);

            Assert.NotNull(result);
            Assert.Null(result.Birthday);
        }

        [Fact]
        public async Task NotFound_ReturnsNull()
        {
            var handler = new FakeHttpMessageHandler().RespondProblem(HttpStatusCode.NotFound, "Not Found");

            var result = await handler.CreateService().GetContactByIdAsync(404, Ct);

            Assert.Null(result);
        }

        [Fact]
        public async Task NotFoundWithEmptyBody_ReturnsNull()
        {
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.NotFound);

            var result = await handler.CreateService().GetContactByIdAsync(404, Ct);

            Assert.Null(result);
        }

        [Fact]
        public async Task OtherProblem_IsNotSwallowed()
        {
            var handler = new FakeHttpMessageHandler().RespondProblem(HttpStatusCode.InternalServerError, "Server error");

            var ex = await Assert.ThrowsAsync<ProblemDetailsException>(() => handler.CreateService().GetContactByIdAsync(1, Ct));

            Assert.Equal(500, ex.ProblemDetails!.Status);
        }
    }

    public class DeleteContact
    {
        [Fact]
        public async Task Success_SendsDeleteRequest()
        {
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.NoContent);

            await handler.CreateService().DeleteContact(9);

            Assert.Equal(HttpMethod.Delete, handler.LastRequest.Method);
            Assert.Equal("/api/contacts/9", handler.LastRequest.Uri!.PathAndQuery);
        }

        [Fact]
        public async Task NonSuccess_ThrowsProblemDetailsException()
        {
            var handler = new FakeHttpMessageHandler().RespondProblem(HttpStatusCode.NotFound, "Not Found");

            var ex = await Assert.ThrowsAsync<ProblemDetailsException>(() => handler.CreateService().DeleteContact(9));

            Assert.Equal(404, ex.ProblemDetails!.Status);
        }

        [Fact]
        public async Task NonSuccessWithoutProblemDetailsHandler_ThrowsHttpRequestException()
        {
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.InternalServerError);
            var service = handler.CreateService(withProblemDetails: false);

            await Assert.ThrowsAsync<HttpRequestException>(() => service.DeleteContact(9));
        }
    }

    public class UpdateContact
    {
        [Fact]
        public async Task Success_SendsPutWithNamesAndBirthdayAsDateOnly()
        {
            var model = ContactBuilder.New.Valid();
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.NoContent);

            await handler.CreateService().UpdateContact(3, model, Ct);

            var request = handler.LastRequest;
            Assert.Equal(HttpMethod.Put, request.Method);
            Assert.Equal("/api/contacts/3", request.Uri!.PathAndQuery);
            var body = ParseBody(request);
            Assert.Equal(model.FirstName, body.GetProperty("firstName").GetString());
            Assert.Equal(model.LastName, body.GetProperty("lastName").GetString());
            Assert.Equal(IsoDate(model.Birthday!.Value), body.GetProperty("birthday").GetString());
        }

        [Fact]
        public async Task WithoutBirthday_SendsNullBirthday()
        {
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.NoContent);

            await handler.CreateService().UpdateContact(3, ContactBuilder.New.WithoutBirthday(), Ct);

            Assert.Equal(JsonValueKind.Null, ParseBody(handler.LastRequest).GetProperty("birthday").ValueKind);
        }

        [Fact]
        public async Task ValidationProblem_ThrowsProblemDetailsExceptionWithFieldErrors()
        {
            var handler = new FakeHttpMessageHandler()
                .RespondProblem(HttpStatusCode.BadRequest, "Validation failed", errors: FieldErrors("LastName"));

            var ex = await Assert.ThrowsAsync<ProblemDetailsException>(() => handler.CreateService().UpdateContact(3, ContactBuilder.New.Valid(), Ct));

            Assert.Equal(["LastName"], ex.ProblemDetails!.GetErrors().Keys);
        }

        [Fact]
        public async Task NonSuccessWithoutProblemDetailsHandler_ThrowsHttpRequestException()
        {
            var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.InternalServerError);
            var service = handler.CreateService(withProblemDetails: false);

            await Assert.ThrowsAsync<HttpRequestException>(() => service.UpdateContact(3, ContactBuilder.New.Valid(), Ct));
        }
    }
}
