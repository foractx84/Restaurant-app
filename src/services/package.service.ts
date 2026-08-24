import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import { RestaurantPackageServiceInterface } from '@/interfaces/restaurantPackage.interface';
import { ManagerPackageServiceInterface } from '@/interfaces/managerPackage.interface';
import { PackagePermissionServiceInterface } from '@/interfaces/packagePermission.interface';
import { generatePermissionsToken } from '@/utils/generateToken';
import { AssignPackageToRestaurantResponseInterface, PackageServiceInterface } from '@interfaces/package.interface';
import { PackagePermissionEntity } from '@/entities/packagePermissions.entity';
import { SubscriptionItemServiceInterface } from '@interfaces/subscriptionItem.interface';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';

class PackageService implements PackageServiceInterface {
  private managerPackageService: ManagerPackageServiceInterface;
  private packagePermissionsService: PackagePermissionServiceInterface;
  private restaurantPackageService: RestaurantPackageServiceInterface;
  private subscriptionItemService: SubscriptionItemServiceInterface;

  constructor(
    managerPackageService: ManagerPackageServiceInterface,
    packagePermissionsService: PackagePermissionServiceInterface,
    restaurantPackageService: RestaurantPackageServiceInterface,
    subscriptionItemService: SubscriptionItemServiceInterface,
  ) {
    this.managerPackageService = managerPackageService;
    this.packagePermissionsService = packagePermissionsService;
    this.restaurantPackageService = restaurantPackageService;
    this.subscriptionItemService = subscriptionItemService;
  }

  assignPackageToRestaurant = async (
    managerID: number,
    managerPackageID: number,
    restaurantID: number,
  ): Promise<AssignPackageToRestaurantResponseInterface> => {
    try {
      const managerPackageEntity = await this.managerPackageService.checkManagerHasAvailablePackage(managerID, managerPackageID);
      const { package_id: packageID, external_user_id } = managerPackageEntity;

      await this.restaurantPackageService.checkRestaurantAlreadyHasPackage(packageID, restaurantID);

      const stripeCustomerID: string = external_user_id?.['stripe_customer_id'];
      const subscriptionItems: SubscriptionItemEntity[] = await this.subscriptionItemService.getSubscriptionItemByStripeCustomerIDAndPackageID(
        stripeCustomerID,
        packageID,
      );
      const ormConn: EntityManager = await ormConnection();
      let result: string[];
      await ormConn.transaction(async conn => {
        const restaurantPackage = await this.restaurantPackageService.createRestaurantPackage(packageID, restaurantID, conn);

        await this.managerPackageService.updateManagerPackage(managerPackageID, conn);
        await this.subscriptionItemService.updateSubscriptionItem(subscriptionItems[0], restaurantPackage.restaurant_package_id, conn);

        result = this.buildPackagePermissionsResponse(await this.packagePermissionsService.getPackagePermissionsByPackageID(packageID, conn));
      });

      // embedded in the token are the permissions[] of string (name) values
      return { permissionToken: generatePermissionsToken(managerID, false, result) };
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while assigning package to restaurantID: ${restaurantID} by managerPackageID: ${managerPackageID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while assigning package to restaurantID: ${restaurantID} by managerPackageID: ${managerPackageID}.  Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  buildPackagePermissionsResponse = (packagePermissions: PackagePermissionEntity[]): string[] => {
    return packagePermissions.map(packagePermission => packagePermission?.permission_id?.['name']);
  };
}

export default PackageService;
