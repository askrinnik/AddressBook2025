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
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status404NotFound)]
  public async Task<GetFilteredContactsResponse> Get([FromQuery] string? search, CancellationToken token) =>
    await sender.Send(new GetFilteredContactsQuery(search), token);

  /// <summary>
  /// Get contact by ID
  /// </summary>
  /// <param name="id">Contact ID</param>
  /// <param name="token"><see cref="CancellationToken"/></param>
  /// <returns>Contact model</returns>
  [HttpGet("{id:int}")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  [ProducesResponseType(StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ContactModel>> GetById([FromRoute] int id, CancellationToken token)
  {
    var contactModel = await sender.Send(new GetContactByIdQuery(id), token);
    if (contactModel == null)
      return NotFound();

    return Ok(contactModel);
  }

  /// <summary>
  /// Create a new contact
  /// </summary>
  /// <param name="request">Contact info</param>
  /// <param name="token"><see cref="CancellationToken"/></param>
  /// <returns></returns>
  [HttpPost]
  [ProducesResponseType(StatusCodes.Status201Created)] 
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  public async Task<ActionResult> CreateContact([FromBody] CreateContactCommand request, CancellationToken token)
  {
    var response = await sender.Send(request, token);
    return CreatedAtAction(nameof(GetById), new { id = response.Id }, null);
  }
}
