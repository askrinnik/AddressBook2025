using AddressBook.Contracts.Models;
using MediatR;

namespace AddressBook.Contracts;

public class CreateContactCommand : IRequest<CreateContactCommandResponse>
{
  /// <summary>
  /// First name
  /// </summary>
  public string FirstName { get; set; } = string.Empty;

  /// <summary>
  /// Last name
  /// </summary>
  public string LastName { get; set; } = string.Empty;

  /// <summary>
  /// Birthday
  /// </summary>
  public DateTime? Birthday { get; set; }
}