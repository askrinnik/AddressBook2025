using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.Collections;

namespace AddressBook.Api;

internal class GlobalExceptionHandler(
  IProblemDetailsService problemDetailsService,
  IHostEnvironment hostEnvironment) : IExceptionHandler
{
  public async ValueTask<bool> TryHandleAsync(
    HttpContext httpContext,
    Exception exception,
    CancellationToken cancellationToken)
  {
    var problemDetails = new ProblemDetails();
    SetGenericDetails(problemDetails, httpContext, exception);

    if (exception is ValidationException validationException)
      SetValidationErrors(problemDetails, validationException);
    else 
      SetInternalServerErrorDetails(problemDetails, exception);

    httpContext.Response.StatusCode = problemDetails.Status!.Value;
    return await problemDetailsService.TryWriteAsync(
      new()
      {
        HttpContext = httpContext,
        Exception = exception,
        ProblemDetails = problemDetails
      });
  }

  private  void SetGenericDetails(ProblemDetails problemDetails, HttpContext httpContext, Exception exception)
  {
    problemDetails.Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}";

    if (exception.StackTrace is not null && hostEnvironment.IsDevelopment()) 
      problemDetails.Extensions["StackTrace"] = exception.StackTrace;

    foreach (DictionaryEntry entry in exception.Data)
      problemDetails.Extensions[entry.Key.ToString()!] = entry.Value;
  }

  private static void SetInternalServerErrorDetails(ProblemDetails problemDetails, Exception exception)
  {
    problemDetails.Type = "https://tools.ietf.org/html/rfc9110#section-15.6.1";
    problemDetails.Title = exception.GetType().Name;
    problemDetails.Status = StatusCodes.Status500InternalServerError;
    problemDetails.Detail = exception.Message;
  }

  private static void SetValidationErrors(ProblemDetails problemDetails, ValidationException validationException)
  {
    problemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
    problemDetails.Title = "Validation Error";
    problemDetails.Status = StatusCodes.Status400BadRequest;
    problemDetails.Detail = "One or more validation errors occurred";
    problemDetails.Extensions["errors"] = validationException.Errors
      .GroupBy(e => e.PropertyName)
      .ToDictionary(
        g => g.Key,
        g => g.Select(x => x.ErrorMessage).ToArray()
      );
  }
}