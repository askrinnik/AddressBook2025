using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AddressBook.Web.Controllers;

/// <summary>
/// Controller for contacts
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ContactsController(
  ISender sender) : ControllerBase
{
  /// <summary>
  /// Get contacts
  /// </summary>
  /// <param name="search">a text in a first or last name</param>
  /// <param name="token"><see cref="CancellationToken"/></param>
  /// <returns>a collection of contacts</returns>
  [HttpGet]
  public async Task<GetFilteredContactsResponse> GetContactById([FromQuery] string? search, CancellationToken token) => 
    await sender.Send(new GetFilteredContactsQuery(search), token);
}