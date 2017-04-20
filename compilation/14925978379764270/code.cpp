#include <iostream>
#include <string>
using namespace std;

class AnimalData {
public:
   void SetName(string givenName) {
      fullName = givenName;
   };
   void SetAge(int numYears) {
      ageYears = numYears;
   };
   // Other parts omitted

   void PrintAll() {
      cout << "Name: "  << fullName;
      cout << ", Age: " << ageYears;
   };

private:
   int    ageYears;
   string fullName;
};

class PetData: public AnimalData {
public:
   void SetID(int petID) {
      idNum = petID;
   };

   // FIXME: Add PrintAll() member function

   /*  Your solution goes here!  */

private:
   int idNum;
};

int main() {
   PetData userPet;

   userPet.SetName("Fluffy");
   userPet.SetAge (4);
   userPet.SetID  (0);
   userPet.PrintAll();
}
