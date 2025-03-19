using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AddressBook.Web.Migrations
{
    /// <inheritdoc />
    public partial class Seeding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Contacts",
                columns: new[] { "Id", "Birthday", "FirstName", "LastName", "OwnerId" },
                values: new object[,]
                {
                    { 1, new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "John", "Doe", 1 },
                    { 2, new DateTime(1992, 2, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), "Jane", "Smith", 1 }
                });

            migrationBuilder.InsertData(
                table: "PhoneOperators",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { 1, "Mobile operator Vodafone in Ukraine", "Vodafone UA" },
                    { 2, "Mobile operator Kyivstar in Ukraine", "Kyivstar UA" },
                    { 3, "Mobile operator Super in Estonia", "Super EE" }
                });

            migrationBuilder.InsertData(
                table: "Phones",
                columns: new[] { "Id", "Comment", "ContactId", "PhoneNumber", "PhoneOperatorId" },
                values: new object[,]
                {
                    { 1, "John's Phone 1", 1, "1234567890", 1 },
                    { 2, "John's Phone 2", 1, "0987654321", 2 },
                    { 3, "Jane's Phone 1", 2, "1112223333", 1 },
                    { 4, "Jane's Phone 2", 2, "4445556666", 2 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PhoneOperators",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Phones",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Phones",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Phones",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Phones",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Contacts",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Contacts",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "PhoneOperators",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "PhoneOperators",
                keyColumn: "Id",
                keyValue: 2);
        }
    }
}
