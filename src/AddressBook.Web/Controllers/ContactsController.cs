using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AddressBook.Web.Controllers;

[ApiController]
[Route("[controller]")]
public class ContactsController(
  ISender sender) : ControllerBase
{
  /// <summary>
  /// Get contacts filtered by first or last name contained the search string
  /// </summary>
  /// <param name="search">a text in a first or last name</param>
  /// <param name="token"><see cref="CancellationToken"/></param>
  /// <returns></returns>
  [HttpGet]
  public async Task<GetFilteredContactsResponse> GetContactById([FromQuery] string? search, CancellationToken token) => 
    await sender.Send(new GetFilteredContactsQuery(search), token);
}