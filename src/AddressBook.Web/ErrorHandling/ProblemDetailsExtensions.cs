using System.Text.Json;
using System.Text.Json.Serialization;

namespace AddressBook.Web.ErrorHandling;

/// <summary>
/// Provides extension methods related to <see cref="ClientProblemDetails"/>.
/// </summary>
public static  class ProblemDetailsExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public static Dictionary<string, string[]> GetErrors(this ClientProblemDetails problemDetails)
    {
        var errors = problemDetails.Extensions["errors"];
        return JsonSerializer.Deserialize<Dictionary<string, string[]>>(errors.ToString()!)!;
    }

    public static ClientProblemDetails? ToProblemDetails(this string content) =>
        JsonSerializer.Deserialize<ClientProblemDetails>(content, JsonOptions);
}