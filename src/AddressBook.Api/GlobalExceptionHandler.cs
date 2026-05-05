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

  private void SetGenericDetails(ProblemDetails problemDetails, HttpContext httpContext, Exception exception)
  {
    problemDetails.Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}";

    if (hostEnvironment.IsDevelopment())
    {
      if (exception.StackTrace is not null)
        problemDetails.Extensions["StackTrace"] = exception.StackTrace;

      // Propagate exception.Data only in development — could contain DB details or other internals
      foreach (DictionaryEntry entry in exception.Data)
        problemDetails.Extensions[entry.Key.ToString()!] = entry.Value;
    }
  }

  private void SetInternalServerErrorDetails(ProblemDetails problemDetails, Exception exception)
  {
    problemDetails.Status = StatusCodes.Status500InternalServerError;

    if (hostEnvironment.IsDevelopment())
    {
      // Full details only in development to avoid leaking internals (DB names, stack info, etc.)
      problemDetails.Title = exception.GetType().Name;
      problemDetails.Detail = exception.Message;
    }
    else
    {
      problemDetails.Title = "Internal Server Error";
      problemDetails.Detail = "An unexpected error occurred.";
    }
  }

  private static void SetValidationErrors(ProblemDetails problemDetails, ValidationException validationException)
  {
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