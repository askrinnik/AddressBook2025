using System.ComponentModel.DataAnnotations;

namespace AddressBook.Web.Models;

/// <summary>
/// Model for creating a new contact
/// </summary>
public class CreateContactModel
{
    /// <summary>
    /// First name
    /// </summary>
    [Required]
    [Display(Name = "First name")]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Last name
    /// </summary>
    [Required]
    [Display(Name = "Last name")]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Birthday
    /// </summary>
    public DateTime? Birthday { get; set; }
}