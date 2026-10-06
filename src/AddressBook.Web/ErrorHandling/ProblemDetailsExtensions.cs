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

    /// <summary>
    /// Returns the per-field validation errors from the <c>errors</c> extension,
    /// or an empty dictionary when the problem details carry none.
    /// </summary>
    public static Dictionary<string, string[]> GetErrors(this ClientProblemDetails problemDetails)
    {
        if (problemDetails.Extensions is null || !problemDetails.Extensions.TryGetValue("errors", out var errors))
            return [];

        // A proxy or another service may send an `errors` member in a different shape; treat it as no field errors.
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string[]>>(errors.ToString()!) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static ClientProblemDetails? ToProblemDetails(this string content) =>
        JsonSerializer.Deserialize<ClientProblemDetails>(content, JsonOptions);
}