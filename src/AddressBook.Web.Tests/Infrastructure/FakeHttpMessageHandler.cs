using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using AddressBook.Web.ErrorHandling;

namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>Запрос, перехваченный <see cref="FakeHttpMessageHandler"/>; тело прочитано сразу.</summary>
public sealed record RecordedRequest(HttpMethod Method, Uri? Uri, string? Body);

/// <summary>
/// Управляемый <see cref="HttpMessageHandler"/> для тестов <see cref="AddressBookApiService"/>:
/// отдаёт заранее заданные ответы (статус, Location, JSON, problem+json) и запоминает запросы.
/// </summary>
public sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private const string DefaultBaseAddress = "http://localhost:5000/api/";

    private readonly Queue<Func<HttpRequestMessage, HttpResponseMessage>> _queue = new();
    private Func<HttpRequestMessage, HttpResponseMessage> _default = _ => new HttpResponseMessage(HttpStatusCode.OK);
    private readonly List<RecordedRequest> _requests = [];

    public IReadOnlyList<RecordedRequest> Requests => _requests;

    public RecordedRequest LastRequest => _requests[^1];

    /// <summary>Ответ по умолчанию для всех запросов; ответы из очереди (<c>Enqueue</c>) имеют приоритет.</summary>
    public FakeHttpMessageHandler Respond(Func<HttpRequestMessage, HttpResponseMessage> factory)
    {
        _default = factory;
        return this;
    }

    public FakeHttpMessageHandler Respond(HttpStatusCode status) => Respond(_ => new HttpResponseMessage(status));

    public FakeHttpMessageHandler RespondJson<T>(HttpStatusCode status, T value) =>
        Respond(_ => JsonResponse(status, value));

    public FakeHttpMessageHandler RespondCreated(string location) =>
        Respond(_ =>
        {
            var response = new HttpResponseMessage(HttpStatusCode.Created);
            response.Headers.Location = new Uri(location, UriKind.RelativeOrAbsolute);
            return response;
        });

    /// <summary>problem+json (RFC 7807); <paramref name="errors"/> кладётся в расширение <c>errors</c>.</summary>
    public FakeHttpMessageHandler RespondProblem(
        HttpStatusCode status,
        string title,
        string? detail = null,
        IDictionary<string, string[]>? errors = null) =>
        Respond(_ => ProblemResponse(status, title, detail, errors));

    /// <summary>Добавляет разовый ответ в очередь (для последовательных вызовов).</summary>
    public FakeHttpMessageHandler Enqueue(Func<HttpRequestMessage, HttpResponseMessage> factory)
    {
        _queue.Enqueue(factory);
        return this;
    }

    public FakeHttpMessageHandler Enqueue(HttpStatusCode status) => Enqueue(_ => new HttpResponseMessage(status));

    /// <summary>
    /// Собирает <see cref="HttpClient"/>; по умолчанию с реальным <see cref="ProblemDetailsHandler"/>
    /// в pipeline, как в <c>Program.cs</c> (non-success → <see cref="ProblemDetailsException"/>).
    /// </summary>
    public HttpClient CreateClient(string baseAddress = DefaultBaseAddress, bool withProblemDetails = true)
    {
        HttpMessageHandler pipeline = withProblemDetails ? new ProblemDetailsHandler { InnerHandler = this } : this;
        return new HttpClient(pipeline, disposeHandler: false) { BaseAddress = new Uri(baseAddress) };
    }

    public AddressBookApiService CreateService(string baseAddress = DefaultBaseAddress, bool withProblemDetails = true) =>
        new(CreateClient(baseAddress, withProblemDetails));

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        _requests.Add(new RecordedRequest(request.Method, request.RequestUri, body));

        var factory = _queue.Count > 0 ? _queue.Dequeue() : _default;
        return factory(request);
    }

    private static HttpResponseMessage JsonResponse<T>(HttpStatusCode status, T value) =>
        new(status) { Content = JsonContent.Create(value) };

    private static HttpResponseMessage ProblemResponse(
        HttpStatusCode status, string title, string? detail, IDictionary<string, string[]>? errors)
    {
        var payload = new Dictionary<string, object?>
        {
            ["type"] = "about:blank",
            ["title"] = title,
            ["status"] = (int)status
        };
        if (detail is not null) payload["detail"] = detail;
        if (errors is not null) payload["errors"] = errors;

        return new HttpResponseMessage(status)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, new MediaTypeHeaderValue("application/problem+json"))
        };
    }
}
